import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Alert, Snackbar } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { rejectWithError } from './promiseRejectWithError';

const ApiClientContext = createContext(null);

export const AuthApiClientProvider = ({ children }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('warning');

  const { token } = useAuth();

  const handleSnackbarClose = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  const showSnackbar = useCallback((message, severity = 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const isHtmlResponse = (data) => {
    if (typeof data === 'string') {
      const trimmedData = data.trim();
      return trimmedData.startsWith('<') && trimmedData.includes('<html');
    }
    return false;
  };

  const apiClient = useMemo(() => {
    const instance = axios.create();

    instance.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => rejectWithError(error),
    );

    instance.interceptors.response.use(
      (response) => {
        if (response.status >= 200 && response.status < 300 && isHtmlResponse(response.data)) {
          const htmlError = new Error('Error to fetch details');
          htmlError.response = {
            ...response,
            status: 500,
            statusText: 'Error to fetch details',
          };

          return Promise.reject(htmlError);
        }

        return response;
      },
      (error) => {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          showSnackbar('You need to be authenticated to access this resource.', 'error');
          return Promise.resolve({ data: null, status, statusText: 'Redirected' });
        }

        if (!error.response) {
          showSnackbar('Server is unreachable right now. Please try again later.', 'error');
          return rejectWithError(error);
        }

        const errorData = error.response?.data;
        const backendMessage =
          errorData?.message ||
          errorData?.error?.message ||
          errorData?.error ||
          error.response?.statusText ||
          'Something went wrong. Please try again later.';

        showSnackbar(backendMessage, 'error');

        return rejectWithError(error);
      },
    );

    return instance;
  }, [token, showSnackbar]);

  return (
    <ApiClientContext.Provider value={apiClient}>
      {children}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ApiClientContext.Provider>
  );
};

AuthApiClientProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useApiClient = () => {
  const apiClient = useContext(ApiClientContext);
  if (!apiClient) {
    console.error('useApiClient must be used within an AuthApiClientProvider');
  }
  return apiClient;
};
