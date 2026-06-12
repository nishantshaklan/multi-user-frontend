import React, { useState, useEffect } from 'react';
import Keycloak from 'keycloak-js';
import { Box, CircularProgress } from '@mui/material';
import { runtimeEnv } from './config/runtimeEnv';
import MultiUserRoot from './MultiUserRoot';

const KEYCLOAK_URL = runtimeEnv('VITE_KEYCLOAK_URL') || '';
const KEYCLOAK_REALM = runtimeEnv('VITE_KEYCLOAK_REALM') || 'converse';
const KEYCLOAK_CLIENT_ID = runtimeEnv('VITE_KEYCLOAK_CLIENT') || 'converse-client';

function createDevKeycloakStub(token) {
  return {
    token,
    authenticated: true,
    updateToken: async () => false,
  };
}

function LoadingScreen() {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress size={48} />
    </Box>
  );
}

/**
 * When the host provides window.keycloak (embedded remote), reuse it.
 * For local dev, set VITE_DEV_ACCESS_TOKEN to skip Keycloak login redirect.
 * Otherwise init Keycloak locally with login-required (redirect URI must be allowlisted).
 */
export default function KeycloakBootstrap() {
  const [keycloak, setKeycloak] = useState(() => globalThis.keycloak || null);
  const [ready, setReady] = useState(!!globalThis.keycloak);

  useEffect(() => {
    if (globalThis.keycloak) {
      setKeycloak(globalThis.keycloak);
      setReady(true);
      return;
    }

    const devAccessToken = runtimeEnv('VITE_DEV_ACCESS_TOKEN');
    if (devAccessToken) {
      setKeycloak(createDevKeycloakStub(devAccessToken));
      setReady(true);
      return;
    }

    if (!KEYCLOAK_URL) {
      setReady(true);
      return;
    }

    const kc = new Keycloak({
      url: KEYCLOAK_URL,
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
    });

    kc
      .init({ onLoad: 'login-required', checkLoginIframe: false })
      .then(() => {
        setKeycloak(kc);
        setReady(true);
      })
      .catch((err) => {
        console.error('Keycloak init failed:', err);
        setReady(true);
      });
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return <MultiUserRoot keycloak={keycloak} />;
}
