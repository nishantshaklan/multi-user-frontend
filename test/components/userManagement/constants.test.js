import { API_ACTION_TO_UI, getRowMenuActions, STATUS_FILTER_TO_API } from '../../../src/components/userManagement/constants';

describe('user management constants', () => {
  it('maps UI status filters to API values', () => {
    expect(STATUS_FILTER_TO_API.All).toBeUndefined();
    expect(STATUS_FILTER_TO_API.Active).toBe('ACTIVE');
  });

  it('maps API actions to UI actions', () => {
    expect(API_ACTION_TO_UI.RESEND_INVITE).toBe('reinvite');
    expect(API_ACTION_TO_UI.DISABLE_USER).toBe('deactivate');
  });

  it('adds inviteAgain for revoked users without duplicate reinvite', () => {
    const actions = getRowMenuActions({
      apiStatus: 'REVOKED',
      availableActions: ['RESEND_INVITE', 'DISABLE_USER'],
    });
    expect(actions).toContain('inviteAgain');
    expect(actions).not.toContain('reinvite');
    expect(actions).toContain('deactivate');
  });

  it('returns unique mapped actions for active users', () => {
    const actions = getRowMenuActions({
      apiStatus: 'ACTIVE',
      availableActions: ['RESEND_INVITE', 'RESEND_INVITE', 'DISABLE_USER'],
    });
    expect(actions).toEqual(['reinvite', 'deactivate']);
  });
});
