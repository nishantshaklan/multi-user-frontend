import React, { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, keycloak, isReady: externalReady = false }) => {
  const [token, setToken] = useState(null);
  const [enterpriseId, setEnterpriseId] = useState(null);
  const [userName, setUserName] = useState(null);
  const isReady = Boolean(externalReady && token);

  const value = useMemo(
    () => ({
      token,
      setToken,
      enterpriseId,
      setEnterpriseId,
      userName,
      setUserName,
      keycloak,
      isReady,
    }),
    [token, enterpriseId, userName, keycloak, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  keycloak: PropTypes.object,
  isReady: PropTypes.bool,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
