import { renderHook, waitFor } from '@testing-library/react';
import useKeycloakToken from '../../src/hooks/useKeycloakToken';
import { AuthProvider } from '../../src/context/AuthContext';

const mockLoadUserProfileFromToken = jest.fn();

jest.mock('../../src/utils/keycloakUserInfo', () => ({
  loadUserProfileFromToken: (...args) => mockLoadUserProfileFromToken(...args),
}));

function wrapper({ keycloak, isReady = true } = {}) {
  return function Wrapper({ children }) {
    return (
      <AuthProvider keycloak={keycloak} isReady={isReady}>
        {children}
      </AuthProvider>
    );
  };
}

describe('useKeycloakToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadUserProfileFromToken.mockResolvedValue({
      enterpriseId: 'ent-1',
      userName: 'Deepak Kumar',
    });
  });

  it('loads token and user profile from keycloak token', async () => {
    const onTokenReady = jest.fn();
    const keycloak = { token: 'access-token' };

    renderHook(() => useKeycloakToken(keycloak, onTokenReady), {
      wrapper: wrapper({ keycloak }),
    });

    await waitFor(() => {
      expect(mockLoadUserProfileFromToken).toHaveBeenCalledWith('access-token');
      expect(onTokenReady).toHaveBeenCalled();
    });
  });
});
