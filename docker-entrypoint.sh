#!/bin/sh

cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  VITE_KEYCLOAK_URL: "${VITE_KEYCLOAK_URL:-}",
  VITE_KEYCLOAK_REALM: "${VITE_KEYCLOAK_REALM:-}",
  VITE_KEYCLOAK_CLIENT: "${VITE_KEYCLOAK_CLIENT:-}",
  VITE_MULTI_USER_API_URL: "${VITE_MULTI_USER_API_URL:-https://converse.showroom.lumegalabs.com/multi-user-api}",
  VITE_ENTERPRISE_USERS_API_BASE_URL: "${VITE_ENTERPRISE_USERS_API_BASE_URL:-}",
  VITE_INVITE_API_KEY: "${VITE_INVITE_API_KEY:-}",
  VITE_PlAN_BASE_URL: "${VITE_PlAN_BASE_URL:-https://converse.showroom.lumegalabs.com/ladder-api/v1}"
};
EOF

echo "Environment configuration injected successfully"
exec nginx -g 'daemon off;'
