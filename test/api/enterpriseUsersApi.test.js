import axios from 'axios';
import {
  deactivateEnterpriseUser,
  fetchEnterpriseUsersSummary,
  getMultiUserApiBaseUrl,
  inviteEnterpriseUser,
  listEnterpriseUsers,
  normalizeEnterpriseUsersSummary,
  reactivateEnterpriseUser,
  resendEnterpriseInvite,
  resolveEnterpriseId,
  revokeEnterpriseInvite,
} from '../../src/api/enterpriseUsersApi';
import { makeJwt } from '../testUtils';

jest.mock('axios');
jest.mock('../../src/config/runtimeEnv', () => ({
  runtimeEnv: jest.fn((name, fallback = '') => {
    const values = {
      VITE_MULTI_USER_API_URL: 'https://api.example/multi-user-api',
      VITE_INVITE_API_KEY: 'invite-key',
    };
    return values[name] ?? fallback;
  }),
}));

describe('enterpriseUsersApi', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('builds multi-user API base URL without trailing slash', () => {
    expect(getMultiUserApiBaseUrl()).toBe('https://api.example/multi-user-api');
  });

  it('resolveEnterpriseId prefers explicit id and reads JWT claims', () => {
    expect(resolveEnterpriseId({ enterpriseId: 'ent-99' })).toBe('ent-99');
    const token = makeJwt({ enterprise_id: 'from-token' });
    expect(resolveEnterpriseId({ token })).toBe('from-token');
    expect(resolveEnterpriseId({ token: 'bad.token' })).toBeNull();
  });

  it('normalizeEnterpriseUsersSummary handles empty and mixed payloads', () => {
    expect(normalizeEnterpriseUsersSummary(null)).toEqual({
      activeUsers: 0,
      invitedUsers: 0,
      seatsUsed: 0,
    });
    expect(
      normalizeEnterpriseUsersSummary({ active: '2', invitedUsers: 1, seatOccupants: '4' }),
    ).toEqual({ activeUsers: 2, invitedUsers: 1, seatsUsed: 4 });
  });

  it('listEnterpriseUsers throws when enterpriseId is missing', async () => {
    await expect(listEnterpriseUsers({ token: 't' })).rejects.toMatchObject({
      code: 'MISSING_ENTERPRISE_ID',
    });
  });

  it('listEnterpriseUsers returns API payload and formats axios errors', async () => {
    axios.get.mockResolvedValueOnce({
      data: { items: [{ id: '1' }], total: 1, page: 1, pageSize: 10 },
    });
    const result = await listEnterpriseUsers({
      enterpriseId: 'ent-1',
      token: 'tok',
      search: '  alice  ',
      status: 'ACTIVE',
    });
    expect(result.items).toHaveLength(1);
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example/multi-user-api/enterprise-users',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'alice', status: 'ACTIVE' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'x-invite-api-key': 'invite-key',
        }),
      }),
    );

    axios.get.mockRejectedValueOnce({ response: { status: 400, data: { message: ['Bad request'] } } });
    await expect(listEnterpriseUsers({ enterpriseId: 'ent-1' })).rejects.toMatchObject({
      message: 'Bad request',
      status: 400,
    });
  });

  it('fetchEnterpriseUsersSummary throws and maps errors', async () => {
    await expect(fetchEnterpriseUsersSummary({})).rejects.toMatchObject({ code: 'MISSING_ENTERPRISE_ID' });

    axios.get.mockResolvedValueOnce({ data: { activeUsers: 1, invitedUsers: 2 } });
    await expect(fetchEnterpriseUsersSummary({ enterpriseId: 'ent-1', token: 't' })).resolves.toEqual({
      activeUsers: 1,
      invitedUsers: 2,
      seatsUsed: 3,
    });

    axios.get.mockRejectedValueOnce({ response: { data: { reason: 'failed' } } });
    await expect(fetchEnterpriseUsersSummary({ enterpriseId: 'ent-1' })).rejects.toMatchObject({
      message: 'failed',
    });
  });

  it('inviteEnterpriseUser posts payload and maps errors', async () => {
    axios.post.mockResolvedValueOnce({ data: { inviteEmailSent: true } });
    await expect(
      inviteEnterpriseUser({
        enterpriseId: 'ent-1',
        token: 't',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        phone: '+911234567890',
      }),
    ).resolves.toEqual({ inviteEmailSent: true });

    axios.post.mockRejectedValueOnce({ response: { data: { message: 'duplicate' } } });
    await expect(
      inviteEnterpriseUser({ enterpriseId: 'ent-1', email: 'a@b.com', firstName: 'A', lastName: 'B' }),
    ).rejects.toMatchObject({ message: 'duplicate' });
  });

  it('posts user action endpoints', async () => {
    axios.post.mockResolvedValue({ data: { ok: true } });
    const opts = { enterpriseId: 'ent-1', token: 't', keycloakUserId: 'kc-1' };

    await resendEnterpriseInvite(opts);
    await revokeEnterpriseInvite(opts);
    await deactivateEnterpriseUser(opts);
    await reactivateEnterpriseUser(opts);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/enterprise-users/kc-1/resend-invite'),
      expect.objectContaining({ enterpriseId: 'ent-1' }),
      expect.any(Object),
    );
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/enterprise-users/kc-1/revoke-invite'),
      expect.objectContaining({ mode: 'DEACTIVATE' }),
      expect.any(Object),
    );
  });

  it('returns empty list payload when API response has no data', async () => {
    axios.get.mockResolvedValueOnce({});
    const result = await listEnterpriseUsers({ enterpriseId: 'ent-1' });
    expect(result).toEqual({ items: [], page: 1, pageSize: 10, total: 0 });
  });

  it('formats non-array API error messages', async () => {
    axios.get.mockRejectedValueOnce({ message: 'network down' });
    await expect(listEnterpriseUsers({ enterpriseId: 'ent-1' })).rejects.toMatchObject({
      message: 'network down',
    });
  });

  it('revokeEnterpriseInvite merges optional body', async () => {
    axios.post.mockResolvedValue({ data: { ok: true } });
    await revokeEnterpriseInvite({
      enterpriseId: 'ent-1',
      keycloakUserId: 'kc-1',
      body: { reason: 'manual' },
    });
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ mode: 'DEACTIVATE', reason: 'manual' }),
      expect.any(Object),
    );
  });
});
