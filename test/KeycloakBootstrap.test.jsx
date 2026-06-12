import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import KeycloakBootstrap from '../src/KeycloakBootstrap';

jest.mock('../src/MultiUserRoot', () =>
  function MockMultiUserRoot({ keycloak }) {
    return <div data-testid="multi-user-root">{keycloak ? 'with-keycloak' : 'no-keycloak'}</div>;
  },
);

jest.mock('keycloak-js', () =>
  jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(true),
    token: 'standalone-token',
  })),
);

jest.mock('../src/config/runtimeEnv', () => ({
  runtimeEnv: jest.fn((name) => {
    if (name === 'VITE_DEV_ACCESS_TOKEN') return '';
    if (name === 'VITE_KEYCLOAK_URL') return '';
    return '';
  }),
}));

describe('KeycloakBootstrap', () => {
  beforeEach(() => {
    delete globalThis.keycloak;
    jest.clearAllMocks();
  });

  it('uses host-provided window.keycloak when embedded', async () => {
    globalThis.keycloak = { token: 'host-token' };

    render(<KeycloakBootstrap />);

    await waitFor(() => {
      expect(screen.getByTestId('multi-user-root')).toHaveTextContent('with-keycloak');
    });
  });

  it('renders without keycloak when KEYCLOAK_URL is not configured', async () => {
    render(<KeycloakBootstrap />);

    await waitFor(() => {
      expect(screen.getByTestId('multi-user-root')).toHaveTextContent('no-keycloak');
    });
  });

  it('uses VITE_DEV_ACCESS_TOKEN and skips Keycloak login redirect', async () => {
    const { runtimeEnv } = require('../src/config/runtimeEnv');
    runtimeEnv.mockImplementation((name) => {
      if (name === 'VITE_DEV_ACCESS_TOKEN') return 'dev-token';
      return '';
    });

    render(<KeycloakBootstrap />);

    await waitFor(() => {
      expect(screen.getByTestId('multi-user-root')).toHaveTextContent('with-keycloak');
    });
  });
});
