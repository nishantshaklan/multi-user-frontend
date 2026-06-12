import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import {
  buildActionConfig,
  useUserManagement,
} from '../../../src/components/userManagement/useUserManagement';
import { createTestQueryClient } from '../../testUtils';

const mockEnqueueSnackbar = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('notistack', () => {
  const actual = jest.requireActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  };
});

jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../src/api/enterpriseUsersApi', () => ({
  listEnterpriseUsers: jest.fn(),
  fetchEnterpriseUsersSummary: jest.fn(),
  inviteEnterpriseUser: jest.fn(),
  deactivateEnterpriseUser: jest.fn(),
  reactivateEnterpriseUser: jest.fn(),
  resendEnterpriseInvite: jest.fn(),
  revokeEnterpriseInvite: jest.fn(),
  resolveEnterpriseId: jest.fn(({ enterpriseId }) => enterpriseId || 'ent-1'),
}));

jest.mock('../../../src/api/planApi', () => ({
  fetchCustomerPlans: jest.fn(),
}));

jest.mock('../../../src/api/readUserLimit', () => ({
  readUserLimit: jest.fn(() => 10),
}));

const enterpriseUsersApi = require('../../../src/api/enterpriseUsersApi');
const planApi = require('../../../src/api/planApi');

function wrapper(queryClient) {
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </QueryClientProvider>
    );
  };
}

describe('useUserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    enterpriseUsersApi.resolveEnterpriseId.mockImplementation(
      ({ enterpriseId }) => enterpriseId || 'ent-1',
    );
    mockUseAuth.mockReturnValue({
      isReady: true,
      token: 'token',
      enterpriseId: 'ent-1',
      keycloak: { updateToken: jest.fn().mockResolvedValue(undefined), token: 'token' },
    });
    enterpriseUsersApi.listEnterpriseUsers.mockResolvedValue({
      items: [{
        id: 'u-1',
        keycloakUserId: 'kc-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        status: 'ACTIVE',
        createdAt: '2024-01-01',
        availableActions: ['DISABLE_USER'],
      }],
      total: 1,
      inviteResendCooldownMinutes: 15,
    });
    enterpriseUsersApi.fetchEnterpriseUsersSummary.mockResolvedValue({
      activeUsers: 1,
      invitedUsers: 1,
      seatsUsed: 2,
    });
    planApi.fetchCustomerPlans.mockResolvedValue({ plan_subs: [] });
  });

  it('loads users and banner stats', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.userLimit).toBe(10);
    expect(result.current.canAddUser).toBe(true);
  });

  it('updates search and status filters', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    act(() => {
      result.current.setQuery('ada');
      result.current.setStatusFilter('Active');
    });

    expect(result.current.query).toBe('ada');
    expect(result.current.statusFilter).toBe('Active');
    expect(result.current.page).toBe(1);
  });

  it('invite returns ok and handles API errors', async () => {
    enterpriseUsersApi.inviteEnterpriseUser.mockResolvedValue({ inviteEmailSent: true });
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.enterpriseId).toBe('ent-1'));

    let inviteResult;
    await act(async () => {
      inviteResult = await result.current.invite({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+919876543210',
      });
    });
    expect(inviteResult.ok).toBe(true);

    enterpriseUsersApi.inviteEnterpriseUser.mockRejectedValueOnce({
      status: 422,
      message: 'Seat limit reached',
      raw: { message: 'Seat limit reached', fieldErrors: { email: 'Taken' } },
    });
    await act(async () => {
      inviteResult = await result.current.invite({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+919876543210',
      });
    });
    expect(inviteResult.ok).toBe(false);
    expect(inviteResult.fieldErrors.email).toBe('Taken');
  });

  it('warns when invite email fails to send and parses array validation errors', async () => {
    enterpriseUsersApi.inviteEnterpriseUser
      .mockResolvedValueOnce({ inviteEmailSent: false })
      .mockRejectedValueOnce({
        status: 400,
        message: 'Failed to send invite',
        raw: {
          validationErrors: [{ field: 'email', message: 'Invalid domain' }],
          message: ['First error', 'Second error'],
        },
      });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.enterpriseId).toBe('ent-1'));

    await act(async () => {
      await result.current.invite({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+919876543210',
      });
    });
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('email failed to send'),
      { variant: 'warning' },
    );

    await act(async () => {
      const failed = await result.current.invite({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+919876543210',
      });
      expect(failed.fieldErrors.email).toBe('Invalid domain');
    });
  });

  it('builds action config descriptions with and without cooldown note', () => {
    const cfg = buildActionConfig({
      deactivateUser: jest.fn(),
      reactivateUser: jest.fn(),
      resendInvite: jest.fn(),
      revokeInvite: jest.fn(),
      inviteAgainUser: jest.fn(),
      inviteResendCooldownMinutes: 15,
    });
    expect(cfg.reinvite.description({ email: 'a@b.com' })).toContain('15 minutes');
    expect(cfg.deactivate.description({ name: 'Ada' })).toContain('Ada');
    expect(cfg.reactivate.description({ name: 'Ada' })).toContain('Ada');
    expect(cfg.inviteAgain.description({ email: 'a@b.com' })).toContain('a@b.com');
    expect(cfg.revoke.description({ name: 'Ada' })).toContain('Ada');

    const deactivateUser = jest.fn();
    const cfgWithMocks = buildActionConfig({
      deactivateUser,
      reactivateUser: jest.fn(),
      resendInvite: jest.fn(),
      revokeInvite: jest.fn(),
      inviteAgainUser: jest.fn(),
      inviteResendCooldownMinutes: 15,
    });
    cfgWithMocks.deactivate.run({ name: 'Ada' });
    expect(deactivateUser).toHaveBeenCalledWith({ name: 'Ada' });

    const cfgNoCooldown = buildActionConfig({
      deactivateUser: jest.fn(),
      reactivateUser: jest.fn(),
      resendInvite: jest.fn(),
      revokeInvite: jest.fn(),
      inviteAgainUser: jest.fn(),
      inviteResendCooldownMinutes: null,
    });
    expect(cfgNoCooldown.reinvite.description({ email: 'a@b.com' })).not.toContain('minutes');
  });

  it('confirmPendingAction blocks reinvite during cooldown', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    act(() => {
      result.current.setPendingAction({
        type: 'reinvite',
        user: { ...result.current.rows[0], inviteResendSecondsRemaining: 30 },
      });
    });

    await act(async () => {
      await result.current.confirmPendingAction();
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Resend invite is on cooldown. Please try again later.',
      { variant: 'warning' },
    );
  });

  it('runs configured user actions and handles mutation outcomes', async () => {
    enterpriseUsersApi.deactivateEnterpriseUser.mockResolvedValue({ inviteEmailSent: false });
    enterpriseUsersApi.reactivateEnterpriseUser.mockResolvedValue({});
    enterpriseUsersApi.resendEnterpriseInvite.mockResolvedValue({});
    enterpriseUsersApi.revokeEnterpriseInvite.mockResolvedValue({});
    enterpriseUsersApi.inviteEnterpriseUser.mockResolvedValue({ inviteEmailSent: true });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    const user = result.current.rows[0];

    await act(async () => {
      await result.current.actionConfig.deactivate.run(user);
      await result.current.actionConfig.reactivate.run(user);
      await result.current.actionConfig.reinvite.run(user);
      await result.current.actionConfig.revoke.run(user);
      await result.current.actionConfig.inviteAgain.run(user);
    });

    expect(enterpriseUsersApi.deactivateEnterpriseUser).toHaveBeenCalled();
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'User updated but email could not be sent. Try Resend invite.',
      { variant: 'warning' },
    );
  });

  it('handles resend cooldown errors from action mutations', async () => {
    enterpriseUsersApi.resendEnterpriseInvite.mockRejectedValueOnce({
      status: 429,
      raw: { code: 'INVITE_RESEND_COOLDOWN', inviteResendSecondsRemaining: 5, message: 'Wait' },
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    await act(async () => {
      await expect(
        result.current.actionConfig.reinvite.run(result.current.rows[0]),
      ).rejects.toMatchObject({ status: 429 });
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Wait', { variant: 'warning' });
  });

  it('handles generic action failures', async () => {
    enterpriseUsersApi.deactivateEnterpriseUser.mockRejectedValueOnce({ message: 'Action failed hard' });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    await act(async () => {
      await expect(
        result.current.actionConfig.deactivate.run(result.current.rows[0]),
      ).rejects.toMatchObject({ message: 'Action failed hard' });
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Action failed hard', { variant: 'error' });
  });

  it('returns false when inviting without enterprise context', async () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      token: 'token',
      enterpriseId: null,
      keycloak: {},
    });
    enterpriseUsersApi.resolveEnterpriseId.mockImplementation(() => null);

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    let inviteResult;
    await act(async () => {
      inviteResult = await result.current.invite({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+919876543210',
      });
    });

    expect(inviteResult.ok).toBe(false);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Enterprise context is missing. Cannot send invite.',
      { variant: 'error' },
    );
  });

  it('uses refreshed keycloak token when updateToken succeeds', async () => {
    const updateToken = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isReady: true,
      token: 'old-token',
      enterpriseId: 'ent-1',
      keycloak: { updateToken, token: 'fresh-token' },
    });
    enterpriseUsersApi.deactivateEnterpriseUser.mockResolvedValue({});

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    await act(async () => {
      await result.current.actionConfig.deactivate.run(result.current.rows[0]);
    });

    expect(updateToken).toHaveBeenCalledWith(30);
    expect(enterpriseUsersApi.deactivateEnterpriseUser).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'fresh-token' }),
    );
  });

  it('marks add user unavailable when plan limit is missing', async () => {
    const readUserLimit = require('../../../src/api/readUserLimit');
    readUserLimit.readUserLimit.mockReturnValue(null);

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.bannerLoading).toBe(false));
    expect(result.current.canAddUser).toBe(false);
  });
});
