import { useCallback, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import {
  deactivateEnterpriseUser,
  fetchEnterpriseUsersSummary,
  inviteEnterpriseUser,
  listEnterpriseUsers,
  reactivateEnterpriseUser,
  resendEnterpriseInvite,
  resolveEnterpriseId,
  revokeEnterpriseInvite,
} from '../../api/enterpriseUsersApi';
import { fetchCustomerPlans } from '../../api/planApi';
import { readUserLimit } from '../../api/readUserLimit';
import {
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  STATUS_FILTER_TO_API,
} from './constants';
import { enterpriseUsersKeys } from './queryKeys';
import { mapApiUserToRow, isInviteResendOnCooldown, parseResendCooldownError } from './userUtils';

export const buildActionConfig = ({
  deactivateUser,
  reactivateUser,
  resendInvite,
  revokeInvite,
  inviteAgainUser,
  inviteResendCooldownMinutes,
}) => ({
  deactivate: {
    title: 'Deactivate user?',
    description: (user) =>
      `${user.name} will lose access immediately and won't be able to sign in until reactivated.`,
    confirmText: 'Deactivate',
    tone: 'danger',
    run: (user) => deactivateUser(user),
  },
  reactivate: {
    title: 'Reactivate user?',
    description: (user) => `${user.name} will regain access to the workspace immediately.`,
    confirmText: 'Reactivate',
    tone: 'primary',
    run: (user) => reactivateUser(user),
  },
  reinvite: {
    title: 'Resend invitation?',
    description: (user) => {
      const cooldownNote =
        inviteResendCooldownMinutes == null
          ? ''
          : ` Invites can be resent once every ${inviteResendCooldownMinutes} minutes.`;
      return `A new invitation email will be sent to ${user.email}. Any previous invite link will be invalidated.${cooldownNote}`;
    },
    confirmText: 'Send Invite',
    tone: 'primary',
    run: (user) => resendInvite(user),
  },
  inviteAgain: {
    title: 'Send invite again?',
    description: (user) =>
      `A new invitation email will be sent to ${user.email}. Their previous invite was revoked and they can be invited again.`,
    confirmText: 'Send Invite',
    tone: 'primary',
    run: (user) => inviteAgainUser(user),
  },
  revoke: {
    title: 'Revoke invitation?',
    description: (user) =>
      `${user.name}'s invite will be cancelled. They won't be able to use the existing invite link.`,
    confirmText: 'Revoke',
    tone: 'danger',
    run: (user) => revokeInvite(user),
  },
});

async function getFreshToken(keycloak, token) {
  if (!keycloak?.updateToken) return token;
  try {
    await keycloak.updateToken(30);
    return keycloak.token || token;
  } catch {
    return token;
  }
}

function parseInviteApiErrors(err) {
  const fallbackMessage = err?.message || 'Failed to send invite';
  const raw = err?.raw;
  const fieldErrors = {};
  let errorMessage = '';

  const addFieldError = (key, value) => {
    if (!key || !value || fieldErrors[key]) return;
    fieldErrors[key] = value;
  };

  if (raw && typeof raw === 'object') {
    const candidateFieldErrors = raw.errors || raw.fieldErrors || raw.validationErrors;
    if (Array.isArray(candidateFieldErrors)) {
      candidateFieldErrors.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        addFieldError(item.field || item.path || item.key, item.message || item.error);
      });
    } else if (candidateFieldErrors && typeof candidateFieldErrors === 'object') {
      Object.entries(candidateFieldErrors).forEach(([key, value]) => {
        addFieldError(key, Array.isArray(value) ? value[0] : value);
      });
    }

    if (typeof raw.message === 'string') errorMessage = raw.message;
    else if (Array.isArray(raw.message) && raw.message.length > 0) errorMessage = raw.message[0];
    else if (typeof raw.reason === 'string') errorMessage = raw.reason;
    else if (typeof raw.error === 'string') errorMessage = raw.error;
  }

  return {
    fieldErrors,
    errorMessage: errorMessage || fallbackMessage,
  };
}

export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { keycloak, token, enterpriseId: authEnterpriseId, isReady } = useAuth();

  const enterpriseId = useMemo(
    () => resolveEnterpriseId({ enterpriseId: authEnterpriseId, token }),
    [authEnterpriseId, token],
  );

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const canFetch = Boolean(isReady && enterpriseId);
  const apiStatus = STATUS_FILTER_TO_API[statusFilter];

  const invalidateEnterpriseUsers = useCallback(
    () => queryClient.invalidateQueries({ queryKey: enterpriseUsersKeys.all }),
    [queryClient],
  );

  const usersQuery = useQuery({
    queryKey: enterpriseUsersKeys.list(enterpriseId, apiStatus, debouncedSearch, page),
    queryFn: async ({ signal }) => {
      const tokenToUse = await getFreshToken(keycloak, token);
      return listEnterpriseUsers({
        enterpriseId,
        token: tokenToUse,
        status: apiStatus,
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
        signal,
      });
    },
    enabled: canFetch,
    placeholderData: keepPreviousData,
  });

  const bannerQuery = useQuery({
    queryKey: enterpriseUsersKeys.banner(enterpriseId),
    queryFn: async ({ signal }) => {
      const tokenToUse = await getFreshToken(keycloak, token);
      const [planData, stats] = await Promise.all([
        fetchCustomerPlans({
          enterpriseId,
          token: tokenToUse,
          signal,
        }),
        fetchEnterpriseUsersSummary({
          enterpriseId,
          token: tokenToUse,
          signal,
        }),
      ]);

      const planSubs = Array.isArray(planData?.plan_subs) ? planData.plan_subs : [];
      return {
        userLimit: readUserLimit(planSubs),
        activeUsers: stats.activeUsers,
        invitedUsers: stats.invitedUsers,
        seatsUsed: stats.seatsUsed,
      };
    },
    enabled: canFetch,
  });

  const rows = useMemo(() => {
    const items = Array.isArray(usersQuery.data?.items) ? usersQuery.data.items : [];
    return items.map(mapApiUserToRow);
  }, [usersQuery.data]);

  const total = useMemo(() => {
    const items = usersQuery.data?.items;
    if (typeof usersQuery.data?.total === 'number') return usersQuery.data.total;
    return Array.isArray(items) ? items.length : 0;
  }, [usersQuery.data]);

  const inviteResendCooldownMinutes = useMemo(() => {
    const value = usersQuery.data?.inviteResendCooldownMinutes;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }, [usersQuery.data]);

  const userLimit = bannerQuery.data?.userLimit ?? null;
  const activeUsers = bannerQuery.data?.activeUsers ?? 0;
  const invitedUsers = bannerQuery.data?.invitedUsers ?? 0;
  const seatsUsed = bannerQuery.data?.seatsUsed ?? 0;
  const loading = usersQuery.isFetching;
  const bannerLoading = bannerQuery.isFetching;
  const error = usersQuery.error?.message || null;

  const refreshAll = useCallback(async () => {
    await invalidateEnterpriseUsers();
  }, [invalidateEnterpriseUsers]);

  const canAddUser = useMemo(() => {
    if (bannerLoading) return true;
    if (userLimit == null) return false;
    return seatsUsed < userLimit;
  }, [bannerLoading, userLimit, seatsUsed]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const actionMutation = useMutation({
    mutationFn: async ({ actionFn }) => {
      const tokenToUse = await getFreshToken(keycloak, token);
      return actionFn(tokenToUse);
    },
    onSuccess: (result, { successMessage }) => {
      if (successMessage) enqueueSnackbar(successMessage, { variant: 'success' });
      if (result?.inviteEmailSent === false) {
        enqueueSnackbar('User updated but email could not be sent. Try Resend invite.', {
          variant: 'warning',
        });
      }
      invalidateEnterpriseUsers();
    },
    onError: (err) => {
      const cooldown = parseResendCooldownError(err);
      if (cooldown) {
        enqueueSnackbar(cooldown.message, { variant: 'warning' });
        invalidateEnterpriseUsers();
        return;
      }
      enqueueSnackbar(err?.message || 'Action failed', { variant: 'error' });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ firstName, lastName, email, phone }) => {
      const tokenToUse = await getFreshToken(keycloak, token);
      return inviteEnterpriseUser({
        enterpriseId,
        token: tokenToUse,
        email,
        firstName,
        lastName,
        phone,
        sendInviteEmail: true,
      });
    },
    onSuccess: (result, { email }) => {
      if (result?.inviteEmailSent === false) {
        enqueueSnackbar(
          `User invited but email failed to send. Use Resend invite for ${email}.`,
          { variant: 'warning' },
        );
      } else {
        enqueueSnackbar(`Invitation sent to ${email}`, { variant: 'success' });
      }
      setPage(1);
      invalidateEnterpriseUsers();
    },
  });

  const runMutation = useCallback(
    (actionFn, successMessage, userId) => {
      if (!enterpriseId) return Promise.resolve();
      return actionMutation.mutateAsync({ actionFn, successMessage, userId });
    },
    [enterpriseId, actionMutation],
  );

  const deactivateUser = useCallback(
    (user) =>
      runMutation(
        (tokenToUse) =>
          deactivateEnterpriseUser({
            enterpriseId,
            token: tokenToUse,
            keycloakUserId: user.keycloakUserId,
          }),
        `${user.name} has been deactivated.`,
        user.id,
      ),
    [enterpriseId, runMutation],
  );

  const reactivateUser = useCallback(
    (user) =>
      runMutation(
        (tokenToUse) =>
          reactivateEnterpriseUser({
            enterpriseId,
            token: tokenToUse,
            keycloakUserId: user.keycloakUserId,
          }),
        `${user.name} has been reactivated.`,
        user.id,
      ),
    [enterpriseId, runMutation],
  );

  const resendInvite = useCallback(
    (user) =>
      runMutation(
        (tokenToUse) =>
          resendEnterpriseInvite({
            enterpriseId,
            token: tokenToUse,
            keycloakUserId: user.keycloakUserId,
          }),
        `Invitation resent to ${user.email}.`,
        user.id,
      ),
    [enterpriseId, runMutation],
  );

  const revokeInvite = useCallback(
    (user) =>
      runMutation(
        (tokenToUse) =>
          revokeEnterpriseInvite({
            enterpriseId,
            token: tokenToUse,
            keycloakUserId: user.keycloakUserId,
          }),
        `${user.name}'s invitation has been revoked.`,
        user.id,
      ),
    [enterpriseId, runMutation],
  );

  const inviteAgainUser = useCallback(
    (user) =>
      runMutation(
        (tokenToUse) =>
          inviteEnterpriseUser({
            enterpriseId,
            token: tokenToUse,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || undefined,
            sendInviteEmail: true,
          }),
        `Invitation sent again to ${user.email}.`,
        user.id,
      ),
    [enterpriseId, runMutation],
  );

  const actionConfig = useMemo(
    () =>
      buildActionConfig({
        deactivateUser,
        reactivateUser,
        resendInvite,
        revokeInvite,
        inviteAgainUser,
        inviteResendCooldownMinutes,
      }),
    [deactivateUser, reactivateUser, resendInvite, revokeInvite, inviteAgainUser, inviteResendCooldownMinutes],
  );

  const isMutating = actionMutation.isPending || inviteMutation.isPending;
  const mutatingUserId = actionMutation.isPending ? actionMutation.variables?.userId : null;

  const confirmPendingAction = async () => {
    if (!pendingAction || isMutating) return;
    const cfg = actionConfig[pendingAction.type];
    if (
      pendingAction.type === 'reinvite' &&
      isInviteResendOnCooldown(pendingAction.user)
    ) {
      setPendingAction(null);
      enqueueSnackbar('Resend invite is on cooldown. Please try again later.', {
        variant: 'warning',
      });
      return;
    }
    setPendingAction(null);
    if (cfg) await cfg.run(pendingAction.user);
  };

  const invite = async ({ firstName, lastName, email, phone }) => {
    if (!enterpriseId) {
      enqueueSnackbar('Enterprise context is missing. Cannot send invite.', { variant: 'error' });
      return { ok: false };
    }

    try {
      await inviteMutation.mutateAsync({ firstName, lastName, email, phone });
      return { ok: true };
    } catch (err) {
      const inviteErrors = parseInviteApiErrors(err);
      const planMsg =
        err?.status === 422
          ? inviteErrors.errorMessage || 'Seat limit reached for this enterprise plan.'
          : inviteErrors.errorMessage || 'Failed to send invite';
      enqueueSnackbar(planMsg, { variant: 'error' });
      return { ok: false, error: err, errorMessage: planMsg, fieldErrors: inviteErrors.fieldErrors };
    }
  };

  const handleQueryChange = (next) => {
    setSearchInput(next);
    setPage(1);
  };

  const handleStatusFilterChange = (next) => {
    setStatusFilter(next);
    setPage(1);
  };

  return {
    enterpriseId,
    rows,
    total,
    totalPages,
    page,
    setPage,
    query: searchInput,
    setQuery: handleQueryChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    loading,
    error,
    refetchList: refreshAll,
    userLimit,
    activeUsers,
    invitedUsers,
    seatsUsed,
    bannerLoading,
    canAddUser,
    pendingAction,
    setPendingAction,
    confirmPendingAction,
    actionConfig,
    isInviteOpen,
    setIsInviteOpen,
    invite,
    inviteResendCooldownMinutes,
    isMutating,
    mutatingUserId,
  };
};
