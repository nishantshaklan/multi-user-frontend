import axios from 'axios';
import { runtimeEnv } from '../config/runtimeEnv';

function trimSlash(value) {
  let s = String(value || '');
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}

function getBaseUrl() {
  return trimSlash(
    runtimeEnv('VITE_PlAN_BASE_URL', 'https://converse.showroom.lumegalabs.com/ladder-api/v1'),
  );
}

export async function fetchCustomerPlans({ enterpriseId, token, signal } = {}) {
  if (!enterpriseId) {
    const err = new Error('enterpriseId is required');
    err.code = 'MISSING_ENTERPRISE_ID';
    throw err;
  }
  const url = `${getBaseUrl()}/customers/${encodeURIComponent(String(enterpriseId))}/subscriptions/plans`;
  const res = await axios.get(url, {
    signal,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res?.data || {};
}
