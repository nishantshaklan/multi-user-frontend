import axios from 'axios';
import { runtimeEnv } from '../config/runtimeEnv';
import { decodeJwtPayload } from '../utils/jwtUtils';

const ENTERPRISE_ID_CLAIMS = [
  'enterpriseId',
  'enterprise_id',
  'customer_external_id',
  'customerExternalId',
  'org_id',
  'orgId',
  'tenant_id',
  'tenantId',
];

function trimSlash(value) {
  let s = String(value || '');
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}

const SHOWROOM_MULTI_USER_API_URL = runtimeEnv('VITE_MULTI_USER_API_URL') || 'https://converse.showroom.lumegalabs.com/multi-user-api';

/** Multi-user API base (see FRONTEND_API.md §1). No trailing slash. */
export function getMultiUserApiBaseUrl() {
  return trimSlash(
    runtimeEnv('VITE_MULTI_USER_API_URL') ||
      runtimeEnv('VITE_ENTERPRISE_USERS_API_BASE_URL') ||
      SHOWROOM_MULTI_USER_API_URL,
  );
}

/** @deprecated Use getMultiUserApiBaseUrl */
export const getEnterpriseUsersBaseUrl = getMultiUserApiBaseUrl;

export function readEnterpriseIdFromClaims(claims) {
  if (!claims || typeof claims !== 'object') return null;

  for (const key of ENTERPRISE_ID_CLAIMS) {
    if (claims[key] != null && claims[key] !== '') {
      return String(claims[key]);
    }
  }
  return null;
}

export function resolveEnterpriseId({ enterpriseId, token } = {}) {
  if (enterpriseId) return String(enterpriseId);
  if (!token) return null;

  const decoded = decodeJwtPayload(token);
  return readEnterpriseIdFromClaims(decoded);
}

function buildHeaders(token) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const inviteKey = runtimeEnv('VITE_INVITE_API_KEY');
  if (inviteKey) headers['x-invite-api-key'] = inviteKey;
  return headers;
}

function formatApiError(error) {
  const data = error?.response?.data;
  if (Array.isArray(data?.message)) return data.message.join(', ');
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.reason === 'string') return data.reason;
  return error?.message || 'Request failed';
}

export async function listEnterpriseUsers({
  enterpriseId,
  token,
  status,
  search,
  page = 1,
  pageSize = 10,
  signal,
} = {}) {
  if (!enterpriseId) {
    const err = new Error('enterpriseId is required');
    err.code = 'MISSING_ENTERPRISE_ID';
    throw err;
  }

  const params = {
    enterpriseId,
    page,
    pageSize,
  };
  if (status) params.status = status;
  const trimmedSearch = String(search || '').trim();
  if (trimmedSearch) params.search = trimmedSearch.slice(0, 200);

  const url = `${getMultiUserApiBaseUrl()}/enterprise-users`;
  try {
    const res = await axios.get(url, {
      params,
      signal,
      headers: buildHeaders(token),
    });
    return res?.data || { items: [], page, pageSize, total: 0 };
  } catch (error) {
    const err = new Error(formatApiError(error));
    err.status = error?.response?.status;
    err.raw = error?.response?.data;
    err.code = error?.response?.data?.code ?? error?.response?.data?.errorCode;
    throw err;
  }
}

function readNonNegativeCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return 0;
}

/** Map GET /enterprise-users/summary response to banner-friendly fields. */
export function normalizeEnterpriseUsersSummary(data) {
  if (!data || typeof data !== 'object') {
    return { activeUsers: 0, invitedUsers: 0, seatsUsed: 0 };
  }

  const activeUsers = readNonNegativeCount(data.active ?? data.activeUsers);
  const invitedUsers = readNonNegativeCount(data.invited ?? data.invitedUsers);
  const seatsUsed = readNonNegativeCount(
    data.seatOccupants ?? data.seatsUsed ?? activeUsers + invitedUsers,
  );

  return { activeUsers, invitedUsers, seatsUsed };
}

/** Status breakdown for User Management banner. GET /enterprise-users/summary */
export async function fetchEnterpriseUsersSummary({
  enterpriseId,
  token,
  signal,
} = {}) {
  if (!enterpriseId) {
    const err = new Error('enterpriseId is required');
    err.code = 'MISSING_ENTERPRISE_ID';
    throw err;
  }

  const url = `${getMultiUserApiBaseUrl()}/enterprise-users/summary`;
  try {
    const res = await axios.get(url, {
      params: { enterpriseId },
      signal,
      headers: buildHeaders(token),
    });
    return normalizeEnterpriseUsersSummary(res?.data);
  } catch (error) {
    const err = new Error(formatApiError(error));
    err.status = error?.response?.status;
    err.raw = error?.response?.data;
    err.code = error?.response?.data?.code ?? error?.response?.data?.errorCode;
    throw err;
  }
}

/** @deprecated Use fetchEnterpriseUsersSummary */
export const fetchEnterpriseUserBannerStats = fetchEnterpriseUsersSummary;

export async function inviteEnterpriseUser({
  enterpriseId,
  token,
  email,
  firstName,
  lastName,
  phone,
  sendInviteEmail = true,
} = {}) {
  const url = `${getMultiUserApiBaseUrl()}/enterprise-users/invite`;
  try {
    const res = await axios.post(
      url,
      {
        enterpriseId,
        email,
        firstName,
        lastName,
        ...(phone ? { phone } : {}),
        sendInviteEmail,
      },
      { headers: buildHeaders(token) },
    );
    return res?.data;
  } catch (error) {
    const err = new Error(formatApiError(error));
    err.status = error?.response?.status;
    err.raw = error?.response?.data;
    err.code = error?.response?.data?.code ?? error?.response?.data?.errorCode;
    throw err;
  }
}

async function postEnterpriseUserAction(path, { enterpriseId, token, keycloakUserId, body = {} }) {
  const url = `${getMultiUserApiBaseUrl()}/enterprise-users/${encodeURIComponent(keycloakUserId)}/${path}`;
  try {
    const res = await axios.post(
      url,
      { enterpriseId, ...body },
      { headers: buildHeaders(token) },
    );
    return res?.data;
  } catch (error) {
    const err = new Error(formatApiError(error));
    err.status = error?.response?.status;
    err.raw = error?.response?.data;
    err.code = error?.response?.data?.code ?? error?.response?.data?.errorCode;
    throw err;
  }
}

export const resendEnterpriseInvite = (opts) =>
  postEnterpriseUserAction('resend-invite', opts);

export const revokeEnterpriseInvite = (opts) =>
  postEnterpriseUserAction('revoke-invite', {
    ...opts,
    body: opts.body
      ? { mode: 'DEACTIVATE', ...opts.body }
      : { mode: 'DEACTIVATE' },
  });

export const deactivateEnterpriseUser = (opts) =>
  postEnterpriseUserAction('deactivate', opts);

export const reactivateEnterpriseUser = (opts) =>
  postEnterpriseUserAction('reactivate', opts);
