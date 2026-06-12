import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagementPanel from '../../../src/components/userManagement/UserManagementPanel';
import { renderWithTheme } from '../../testUtils';

const mockUseUserManagement = jest.fn();

jest.mock('../../../src/components/userManagement/useUserManagement', () => ({
  useUserManagement: () => mockUseUserManagement(),
}));

const baseUx = {
  enterpriseId: 'ent-1',
  rows: [],
  total: 0,
  totalPages: 1,
  page: 1,
  setPage: jest.fn(),
  query: '',
  setQuery: jest.fn(),
  statusFilter: 'All',
  setStatusFilter: jest.fn(),
  loading: false,
  error: null,
  refetchList: jest.fn(),
  userLimit: 10,
  activeUsers: 2,
  invitedUsers: 1,
  seatsUsed: 3,
  bannerLoading: false,
  canAddUser: true,
  pendingAction: null,
  setPendingAction: jest.fn(),
  confirmPendingAction: jest.fn(),
  actionConfig: {},
  isInviteOpen: false,
  setIsInviteOpen: jest.fn(),
  invite: jest.fn(),
  isMutating: false,
  mutatingUserId: null,
};

describe('UserManagementPanel', () => {
  beforeEach(() => {
    mockUseUserManagement.mockReturnValue({ ...baseUx });
  });

  it('renders page title and stats banner', () => {
    renderWithTheme(<UserManagementPanel />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Users');
    expect(screen.getByText('User Limit')).toBeInTheDocument();
  });

  it('shows enterprise warning, list error, and opens invite dialog', async () => {
    const user = userEvent.setup();
    const setIsInviteOpen = jest.fn();
    mockUseUserManagement.mockReturnValue({
      ...baseUx,
      enterpriseId: null,
      error: 'Failed to load users',
      setIsInviteOpen,
    });

    renderWithTheme(<UserManagementPanel />);
    expect(screen.getByText(/Enterprise ID is not available/)).toBeInTheDocument();
    expect(screen.getByText('Failed to load users')).toBeInTheDocument();

    await user.click(screen.getByTestId('add-user-btn'));
    expect(setIsInviteOpen).toHaveBeenCalledWith(true);
  });

  it('disables add user when seat limit is reached', () => {
    mockUseUserManagement.mockReturnValue({
      ...baseUx,
      canAddUser: false,
      userLimit: 5,
      seatsUsed: 5,
    });
    renderWithTheme(<UserManagementPanel />);
    expect(screen.getByTestId('add-user-btn')).toBeDisabled();
  });

  it('renders table rows, footer, and open dialogs', () => {
    mockUseUserManagement.mockReturnValue({
      ...baseUx,
      rows: [{
        id: 'u-1',
        keycloakUserId: 'kc-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        msisdn: '+911234567890',
        status: 'Active',
        apiStatus: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        availableActions: ['DISABLE_USER'],
      }],
      total: 1,
      isInviteOpen: true,
      pendingAction: {
        type: 'deactivate',
        user: {
          id: 'u-1',
          keycloakUserId: 'kc-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
        },
      },
      actionConfig: {
        deactivate: {
          title: 'Deactivate user?',
          description: () => 'desc',
          confirmText: 'Deactivate',
          tone: 'danger',
          run: jest.fn(),
        },
      },
    });

    renderWithTheme(<UserManagementPanel />);
    expect(screen.getByTestId('user-row-u-1')).toBeInTheDocument();
    expect(screen.getByTestId('users-count-footer')).toHaveTextContent('Showing results 1-1 of 1');
    expect(screen.getByTestId('invite-first-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('Deactivate user?');
  });

  it('shows loading spinner for empty list fetch', () => {
    mockUseUserManagement.mockReturnValue({
      ...baseUx,
      loading: true,
      rows: [],
    });
    renderWithTheme(<UserManagementPanel />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
