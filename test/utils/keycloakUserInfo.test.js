import {
  extractUserProfileFromUserInfo,
  fetchKeycloakUserInfo,
  loadUserProfileFromToken,
} from '../../src/utils/keycloakUserInfo';
import { makeJwt } from '../testUtils';

describe('keycloakUserInfo', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('fetchKeycloakUserInfo calls issuer userinfo endpoint with bearer token', async () => {
    const token = makeJwt({ iss: 'https://issuer.example/auth/realms/demo' });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ enterpriseId: 'ent-1', name: 'Ada Lovelace' }),
    });

    const result = await fetchKeycloakUserInfo(token);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://issuer.example/auth/realms/demo/protocol/openid-connect/userinfo',
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(result).toEqual({ enterpriseId: 'ent-1', name: 'Ada Lovelace' });
  });

  it('extractUserProfileFromUserInfo reads enterpriseId and display name', () => {
    expect(
      extractUserProfileFromUserInfo({
        enterpriseId: 'ent-42',
        name: 'Deepak Kumar',
      }),
    ).toEqual({
      enterpriseId: 'ent-42',
      userName: 'Deepak Kumar',
    });
  });

  it('loadUserProfileFromToken returns null profile when userinfo fails', async () => {
    const token = makeJwt({ iss: 'https://issuer.example/auth/realms/demo' });
    global.fetch.mockResolvedValue({ ok: false });

    await expect(loadUserProfileFromToken(token)).resolves.toEqual({
      enterpriseId: null,
      userName: null,
    });
  });
});
