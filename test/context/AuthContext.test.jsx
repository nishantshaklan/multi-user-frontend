import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

function AuthReader() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-ready">{String(auth.isReady)}</div>
      <div data-testid="auth-token">{auth.token || ''}</div>
      <div data-testid="auth-enterprise">{auth.enterpriseId || ''}</div>
    </div>
  );
}

describe('AuthContext', () => {
  it('provides auth value to children when token is set', async () => {
    function TestApp() {
      const { setToken, setEnterpriseId } = useAuth();
      React.useEffect(() => {
        setToken('tok');
        setEnterpriseId('ent-1');
      }, [setToken, setEnterpriseId]);

      return <AuthReader />;
    }

    render(
      <AuthProvider keycloak={{ token: 'tok' }} isReady>
        <TestApp />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-token')).toHaveTextContent('tok');
      expect(screen.getByTestId('auth-enterprise')).toHaveTextContent('ent-1');
      expect(screen.getByTestId('auth-ready')).toHaveTextContent('true');
    });
  });

  it('throws when useAuth is used outside provider', () => {
    expect(() => render(<AuthReader />)).toThrow('useAuth must be used within AuthProvider');
  });
});
