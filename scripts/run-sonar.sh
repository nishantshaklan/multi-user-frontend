#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  echo "SONAR_TOKEN is not set. Add it to .env or export it before running sonar." >&2
  exit 1
fi

if npm pkg get scripts.test:coverage 2>/dev/null | grep -qv null; then
  npm run test:coverage -- --watch=false --watchman=false --runInBand --silent || true
else
  echo "No test:coverage script found; running Sonar without coverage report."
fi

sonar-scanner
