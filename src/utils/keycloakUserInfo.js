import { decodeJwtPayload } from './jwtUtils';
import { readEnterpriseIdFromClaims } from '../api/enterpriseUsersApi';

export async function fetchKeycloakUserInfo(accessToken) {
  if (!accessToken) return null;

  const decoded = decodeJwtPayload(accessToken);
  const issuerUri = decoded?.iss;
  if (!issuerUri) return null;

  const url = `${issuerUri}/protocol/openid-connect/userinfo`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;
  return response.json();
}

export function extractUserProfileFromUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') {
    return { enterpriseId: null, userName: null };
  }

  const enterpriseId = readEnterpriseIdFromClaims(userInfo);
  const userName =
    (typeof userInfo.name === 'string' && userInfo.name) ||
    [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ') ||
    userInfo.preferred_username ||
    null;

  return { enterpriseId, userName };
}

export async function loadUserProfileFromToken(accessToken) {
  try {
    const userInfo = await fetchKeycloakUserInfo(accessToken);
    return extractUserProfileFromUserInfo(userInfo);
  } catch {
    return { enterpriseId: null, userName: null };
  }
}
