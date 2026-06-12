import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteUserDialog from '../../../src/components/userManagement/InviteUserDialog';
import theme from '../../../src/theme/Theme';
import { renderWithTheme } from '../../testUtils';

describe('InviteUserDialog', () => {
  it('validates required fields and submits invite payload', async () => {
    const user = userEvent.setup();
    const onInvite = jest.fn().mockResolvedValue({ ok: true });
    const onClose = jest.fn();

    renderWithTheme(
      <InviteUserDialog open onClose={onClose} onInvite={onInvite} theme={theme} />,
    );

    await user.click(screen.getByTestId('invite-send-btn'));
    expect(screen.getByText('First name is required')).toBeInTheDocument();

    await user.type(screen.getByTestId('invite-first-name-input'), 'Ada');
    await user.type(screen.getByTestId('invite-last-name-input'), 'Lovelace');
    await user.type(screen.getByTestId('invite-email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('invite-phone-input'), '9876543210');
    await user.click(screen.getByTestId('invite-send-btn'));

    expect(onInvite).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+919876543210',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows API field and submit errors', async () => {
    const user = userEvent.setup();
    const onInvite = jest.fn().mockResolvedValue({
      ok: false,
      fieldErrors: { email: 'Already invited' },
      errorMessage: 'Invite failed',
    });

    renderWithTheme(
      <InviteUserDialog open onClose={jest.fn()} onInvite={onInvite} theme={theme} />,
    );

    await user.type(screen.getByTestId('invite-first-name-input'), 'Ada');
    await user.type(screen.getByTestId('invite-last-name-input'), 'Lovelace');
    await user.type(screen.getByTestId('invite-email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('invite-phone-input'), '9876543210');
    await user.click(screen.getByTestId('invite-send-btn'));

    expect(await screen.findByText('Already invited')).toBeInTheDocument();
    expect(screen.getByText('Invite failed')).toBeInTheDocument();
  });
});
