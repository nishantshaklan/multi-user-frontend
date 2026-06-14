import React, { useState, useEffect } from 'react';
import Keycloak from 'keycloak-js';
import { Box, CircularProgress } from '@mui/material';
import { runtimeEnv } from './config/runtimeEnv';
import MultiUserRoot from './MultiUserRoot';

function isLocalDevHost() {
  if (typeof globalThis.location === 'undefined') return false;
  const host = globalThis.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

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

function getTokenFromUrl() {
  if (typeof globalThis.location === 'undefined') return '';
  return new URLSearchParams(globalThis.location.search).get('token') || '';
}

function stripTokenFromUrl() {
  if (typeof globalThis.history === 'undefined' || typeof globalThis.location === 'undefined') return;
  const url = new URL(globalThis.location.href);
  if (!url.searchParams.has('token')) return;
  url.searchParams.delete('token');
  const next = `${url.pathname}${url.search}${url.hash}`;
  globalThis.history.replaceState({}, '', next);
}

/**
 * When the host provides window.keycloak (embedded remote), reuse it.
 * When Converse embeds this app in an iframe it passes ?token= on the URL.
 * On localhost only, VITE_DEV_ACCESS_TOKEN can skip Keycloak for local dev.
 * Otherwise init Keycloak with login-required (same as cdp-frontend).
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

    const iframeToken = getTokenFromUrl();
    if (iframeToken) {
      stripTokenFromUrl();
      setKeycloak(createDevKeycloakStub(iframeToken));
      setReady(true);
      return;
    }

    const keycloakUrl = (runtimeEnv('VITE_KEYCLOAK_URL') || '').replace(/\/$/, '');
    const keycloakRealm = runtimeEnv('VITE_KEYCLOAK_REALM') || 'converse';
    const keycloakClientId = runtimeEnv('VITE_KEYCLOAK_CLIENT') || 'converse-client';

    if (isLocalDevHost()) {
      const devAccessToken = runtimeEnv('VITE_DEV_ACCESS_TOKEN');
      if (devAccessToken) {
        setKeycloak(createDevKeycloakStub(devAccessToken));
        setReady(true);
        return;
      }
    }

    if (!keycloakUrl) {
      setReady(true);
      return;
    }

    const kc = new Keycloak({
      url: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
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
