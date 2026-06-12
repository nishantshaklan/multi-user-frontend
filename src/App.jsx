import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CssBaseline, ThemeProvider, Box, CircularProgress } from '@mui/material';
import theme from './theme/Theme';
import UserManagementPanel from './components/userManagement/UserManagementPanel';
import { AuthProvider } from './context/AuthContext';
import { AuthApiClientProvider } from './utils/apiClient';
import useKeycloakToken from './hooks/useKeycloakToken';

function KeycloakTokenInitializer({ keycloak, onTokenReady }) {
  useKeycloakToken(keycloak, onTokenReady);
  return null;
}

KeycloakTokenInitializer.propTypes = {
  keycloak: PropTypes.object,
  onTokenReady: PropTypes.func.isRequired,
};

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

function App({ keycloak } = {}) {
  const [tokenReady, setTokenReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const hasKeycloak = Boolean(keycloak);
    const hasToken = Boolean(keycloak?.token);
    setTokenReady(!hasKeycloak || hasToken);
    setIsInitializing(hasKeycloak && !hasToken);
  }, [keycloak?.token, keycloak]);

  const handleTokenReady = () => {
    setTokenReady(true);
    setIsInitializing(false);
  };

  if (isInitializing && !tokenReady) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider keycloak={keycloak} isReady={tokenReady}>
        <KeycloakTokenInitializer keycloak={keycloak} onTokenReady={handleTokenReady} />
        <AuthApiClientProvider>
          {tokenReady ? <UserManagementPanel /> : <LoadingScreen />}
        </AuthApiClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

App.propTypes = {
  keycloak: PropTypes.object,
};

export default App;
