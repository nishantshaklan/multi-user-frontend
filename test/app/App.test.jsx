import React from 'react';
import { screen } from '@testing-library/react';
import App from '../../src/App';
import { renderWithTheme } from '../testUtils';
import { makeJwt } from '../testUtils';

jest.mock('../../src/components/userManagement/UserManagementPanel', () =>
  function MockUserManagementPanel() {
    return <div data-testid="user-management-panel">Users Panel</div>;
  },
);

describe('App', () => {
  it('renders user management panel when keycloak token is ready', () => {
    const token = makeJwt({ enterpriseId: 'ent-1' });
    renderWithTheme(<App keycloak={{ token }} />);
    expect(screen.getByTestId('user-management-panel')).toBeInTheDocument();
  });

  it('shows loading screen while keycloak has no token', () => {
    renderWithTheme(<App keycloak={{}} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders without keycloak when tokenReady is immediate', () => {
    renderWithTheme(<App />);
    expect(screen.getByTestId('user-management-panel')).toBeInTheDocument();
  });
});
