export const STATUS_FILTERS = ['All', 'Active', 'Invited', 'Inactive', 'Revoked'];

export const PAGE_SIZE = 10;

export const SEARCH_DEBOUNCE_MS = 400;

export const STATUS_FILTER_TO_API = {
  All: undefined,
  Active: 'ACTIVE',
  Invited: 'INVITED',
  Inactive: 'INACTIVE',
  Revoked: 'REVOKED',
};

export const API_ACTION_TO_UI = {
  RESEND_INVITE: 'reinvite',
  REVOKE_INVITE: 'revoke',
  DISABLE_USER: 'deactivate',
  REACTIVATE: 'reactivate',
};

/** Row menu actions: API codes + Revoked fallback for send-invite-again */
export const getRowMenuActions = (user) => {
  const fromApi = (user.availableActions || [])
    .map((code) => API_ACTION_TO_UI[code])
    .filter(Boolean);

  if (user.apiStatus === 'REVOKED') {
    const actions = fromApi.filter((action) => action !== 'reinvite');
    if (!actions.includes('inviteAgain')) {
      actions.push('inviteAgain');
    }
    return [...new Set(actions)];
  }

  return [...new Set(fromApi)];
};
