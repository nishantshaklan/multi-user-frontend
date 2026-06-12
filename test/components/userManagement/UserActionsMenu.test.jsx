import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserActionsMenu from '../../../src/components/userManagement/UserActionsMenu';
import theme from '../../../src/theme/Theme';
import { renderWithTheme } from '../../testUtils';

const user = {
  id: 'u-1',
  keycloakUserId: 'kc-1',
  name: 'Ada Lovelace',
  apiStatus: 'INVITED',
  availableActions: ['RESEND_INVITE', 'DISABLE_USER'],
  inviteResendSecondsRemaining: 30,
};

describe('UserActionsMenu', () => {
  it('returns null when no actions are available', () => {
    const { container } = renderWithTheme(
      <UserActionsMenu
        user={{ ...user, availableActions: [] }}
        onAction={jest.fn()}
        theme={theme}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('opens menu and fires selected action', async () => {
    const click = userEvent.setup();
    const onAction = jest.fn();
    renderWithTheme(
      <UserActionsMenu
        user={{ ...user, inviteResendSecondsRemaining: 0, availableActions: ['DISABLE_USER'] }}
        onAction={onAction}
        theme={theme}
      />,
    );

    await click.click(screen.getByTestId('user-actions-trigger-u-1'));
    await click.click(await screen.findByTestId('action-deactivate-u-1'));
    expect(onAction).toHaveBeenCalledWith({ type: 'deactivate', user: expect.objectContaining({ id: 'u-1' }) });
  });

  it('shows spinner while row is mutating', () => {
    renderWithTheme(
      <UserActionsMenu user={user} onAction={jest.fn()} isRowMutating theme={theme} />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
