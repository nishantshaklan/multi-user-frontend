/**
 * Build-time (webpack) env with optional runtime override from docker-entrypoint env-config.js.
 */
const BUILD_ENV = {
  VITE_KEYCLOAK_URL: process.env.VITE_KEYCLOAK_URL,
  VITE_KEYCLOAK_REALM: process.env.VITE_KEYCLOAK_REALM,
  VITE_KEYCLOAK_CLIENT: process.env.VITE_KEYCLOAK_CLIENT,
  VITE_MULTI_USER_API_URL: process.env.VITE_MULTI_USER_API_URL,
  VITE_ENTERPRISE_USERS_API_BASE_URL: process.env.VITE_ENTERPRISE_USERS_API_BASE_URL,
  VITE_INVITE_API_KEY: process.env.VITE_INVITE_API_KEY,
  VITE_PlAN_BASE_URL: process.env.VITE_PlAN_BASE_URL,
  VITE_DEV_ACCESS_TOKEN: process.env.VITE_DEV_ACCESS_TOKEN,
};

export function runtimeEnv(name, fallback = '') {
  if (typeof globalThis !== 'undefined' && globalThis._env_) {
    const runtime = globalThis._env_[name];
    if (runtime != null && runtime !== '') return runtime;
  }
  const built = BUILD_ENV[name];
  if (built != null && built !== '') return built;
  return fallback;
}
