import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersTable from '../../../src/components/userManagement/UsersTable';
import theme from '../../../src/theme/Theme';
import { renderWithTheme } from '../../testUtils';

const sampleRows = [
  {
    id: 'u-1',
    keycloakUserId: 'kc-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    msisdn: '+911234567890',
    status: 'Active',
    apiStatus: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
    availableActions: ['DISABLE_USER'],
  },
];

describe('UsersTable', () => {
  it('renders empty state and populated rows', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    const { rerender } = renderWithTheme(
      <UsersTable rows={[]} loading={false} onAction={onAction} theme={theme} />,
    );
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No users match your filters.');

    rerender(
      <UsersTable rows={sampleRows} loading={false} onAction={onAction} theme={theme} />,
    );
    expect(screen.getByTestId('user-row-u-1')).toBeInTheDocument();
    await user.click(screen.getByTestId('user-actions-trigger-u-1'));
    await user.click(await screen.findByTestId('action-deactivate-u-1'));
    expect(onAction).toHaveBeenCalledWith({ type: 'deactivate', user: sampleRows[0] });
  });

  it('shows loading overlay when refreshing existing rows', () => {
    renderWithTheme(
      <UsersTable rows={sampleRows} loading onAction={jest.fn()} theme={theme} />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
