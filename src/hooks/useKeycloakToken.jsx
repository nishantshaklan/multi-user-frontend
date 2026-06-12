import { useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadUserProfileFromToken } from '../utils/keycloakUserInfo';

const useKeycloakToken = (keycloak, onTokenReady) => {
  const { setToken, setEnterpriseId, setUserName } = useAuth();

  const applyUserProfile = useCallback(
    async (accessToken) => {
      const profile = await loadUserProfileFromToken(accessToken);
      setEnterpriseId(profile.enterpriseId);
      setUserName(profile.userName);
      return profile;
    },
    [setEnterpriseId, setUserName],
  );

  const syncTokenAndProfile = useCallback(
    async (accessToken) => {
      if (!accessToken) return;
      setToken(accessToken);
      await applyUserProfile(accessToken);
    },
    [setToken, applyUserProfile],
  );

  useEffect(() => {
    let cancelled = false;

    const initializeToken = async () => {
      try {
        if (keycloak?.token) {
          if (!cancelled) {
            await syncTokenAndProfile(keycloak.token);
            onTokenReady?.();
          }
          return;
        }

        if (keycloak && !keycloak.token && keycloak.authenticated) {
          try {
            const refreshed = await keycloak.updateToken(30);
            if (refreshed && keycloak.token && !cancelled) {
              await syncTokenAndProfile(keycloak.token);
              onTokenReady?.();
              return;
            }
          } catch (error) {
            console.warn('Failed to refresh token:', error);
          }
        }

        if (!cancelled) onTokenReady?.();
      } catch (error) {
        console.error('Error initializing token:', error);
        if (!cancelled) onTokenReady?.();
      }
    };

    initializeToken();

    return () => {
      cancelled = true;
    };
  }, [keycloak, keycloak?.token, keycloak?.authenticated, syncTokenAndProfile, onTokenReady]);

  useEffect(() => {
    if (!keycloak) return;

    const handleTokenRefresh = async () => {
      if (!keycloak.token) return;
      await syncTokenAndProfile(keycloak.token);
    };

    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            handleTokenRefresh();
          }
        })
        .catch((error) => {
          console.error('Failed to refresh token:', error);
        });
    };

    keycloak.onAuthRefreshSuccess = handleTokenRefresh;

    return () => {
      keycloak.onTokenExpired = undefined;
      keycloak.onAuthRefreshSuccess = undefined;
    };
  }, [keycloak, syncTokenAndProfile]);
};

export default useKeycloakToken;
