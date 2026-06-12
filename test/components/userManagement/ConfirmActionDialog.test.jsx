import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmActionDialog from '../../../src/components/userManagement/ConfirmActionDialog';
import { buildActionConfig } from '../../../src/components/userManagement/useUserManagement';
import theme from '../../../src/theme/Theme';
import { renderWithTheme } from '../../testUtils';

const user = {
  id: 'u-1',
  keycloakUserId: 'kc-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

describe('ConfirmActionDialog', () => {
  it('renders nothing visible when no pending action', () => {
    const { container } = renderWithTheme(
      <ConfirmActionDialog
        pendingAction={null}
        actionConfig={{}}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        theme={theme}
      />,
    );
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
  });

  it('confirms deactivate action', async () => {
    const click = userEvent.setup();
    const onConfirm = jest.fn();
    const actionConfig = buildActionConfig({
      deactivateUser: jest.fn(),
      reactivateUser: jest.fn(),
      resendInvite: jest.fn(),
      revokeInvite: jest.fn(),
      inviteAgainUser: jest.fn(),
      inviteResendCooldownMinutes: 15,
    });

    renderWithTheme(
      <ConfirmActionDialog
        pendingAction={{ type: 'deactivate', user }}
        actionConfig={actionConfig}
        onCancel={jest.fn()}
        onConfirm={onConfirm}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('Deactivate user?');
    await click.click(screen.getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables resend confirm during cooldown', () => {
    const actionConfig = buildActionConfig({
      deactivateUser: jest.fn(),
      reactivateUser: jest.fn(),
      resendInvite: jest.fn(),
      revokeInvite: jest.fn(),
      inviteAgainUser: jest.fn(),
      inviteResendCooldownMinutes: 15,
    });

    renderWithTheme(
      <ConfirmActionDialog
        pendingAction={{
          type: 'reinvite',
          user: { ...user, inviteResendSecondsRemaining: 30 },
        }}
        actionConfig={actionConfig}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('confirm-dialog-cooldown')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-confirm')).toBeDisabled();
  });
});
