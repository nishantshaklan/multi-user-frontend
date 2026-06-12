import React from 'react';
import PropTypes from 'prop-types';
import { QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import App from './App';
import { queryClient } from './query/queryClient';

const MultiUserRoot = ({ keycloak }) => (
  <QueryClientProvider client={queryClient}>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={3500}
    >
      <App keycloak={keycloak} />
    </SnackbarProvider>
  </QueryClientProvider>
);

MultiUserRoot.propTypes = {
  keycloak: PropTypes.object,
};

export default MultiUserRoot;
