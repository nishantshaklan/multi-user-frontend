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

  it('uses VITE_DEV_ACCESS_TOKEN on localhost only', async () => {
    const { runtimeEnv } = require('../src/config/runtimeEnv');
    runtimeEnv.mockImplementation((name) => {
      if (name === 'VITE_DEV_ACCESS_TOKEN') return 'dev-token';
      return '';
    });

    Object.defineProperty(globalThis, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
    });

    render(<KeycloakBootstrap />);

    await waitFor(() => {
      expect(screen.getByTestId('multi-user-root')).toHaveTextContent('with-keycloak');
    });
  });

  it('uses ?token= from URL when embedded in Converse iframe', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: {
        hostname: 'multi-user.showroom.lumegalabs.com',
        href: 'https://multi-user.showroom.lumegalabs.com/?token=iframe-token',
        search: '?token=iframe-token',
        pathname: '/',
      },
      writable: true,
    });
    globalThis.history.replaceState = jest.fn();

    render(<KeycloakBootstrap />);

    await waitFor(() => {
      expect(screen.getByTestId('multi-user-root')).toHaveTextContent('with-keycloak');
    });
    expect(globalThis.history.replaceState).toHaveBeenCalled();
  });

  it('does not use VITE_DEV_ACCESS_TOKEN on production host', async () => {
    const Keycloak = require('keycloak-js');
    const { runtimeEnv } = require('../src/config/runtimeEnv');
    runtimeEnv.mockImplementation((name) => {
      if (name === 'VITE_DEV_ACCESS_TOKEN') return 'dev-token';
      if (name === 'VITE_KEYCLOAK_URL') return 'https://keycloak.example.com';
      if (name === 'VITE_KEYCLOAK_REALM') return 'converse';
      if (name === 'VITE_KEYCLOAK_CLIENT') return 'converse-client';
      return '';
    });

    Object.defineProperty(globalThis, 'location', {
      value: { hostname: 'multi-user.showroom.lumegalabs.com' },
      writable: true,
    });

    render(<KeycloakBootstrap />);

    await waitFor(() => {
      expect(Keycloak).toHaveBeenCalled();
      expect(screen.getByTestId('multi-user-root')).toHaveTextContent('with-keycloak');
    });
  });
});
