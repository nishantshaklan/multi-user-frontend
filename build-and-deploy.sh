#!/usr/bin/env bash
# Build, push, and deploy multi-user-frontend to Kubernetes (Rancher).
# Usage: ./build-and-deploy.sh [registry] [version] [build-only]
# Example: ./build-and-deploy.sh ghcr.io/nishantshaklan/multi-user-frontend latest

set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
    DOCKER_MAC_BIN="/Applications/Docker.app/Contents/Resources/bin"
    if [ -x "${DOCKER_MAC_BIN}/docker" ]; then
        export PATH="${DOCKER_MAC_BIN}:${PATH}"
    fi
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

REGISTRY=${1:-"ghcr.io/nishantshaklan/multi-user-frontend"}
VERSION=${2:-"latest"}
REGISTRY_LOWER=$(echo "${REGISTRY}" | tr '[:upper:]' '[:lower:]')
REGISTRY=${REGISTRY_LOWER}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

if [[ "${REGISTRY}" == *"ghcr.io"* ]] && [ -n "${GITHUB_TOKEN:-${GHCR_TOKEN:-}}" ]; then
    GITHUB_USERNAME=$(echo "${REGISTRY}" | sed -E 's|ghcr.io/([^/]+).*|\1|')
    TOKEN="${GITHUB_TOKEN:-${GHCR_TOKEN:-}}"
    print_info "Logging in to ghcr.io..."
    echo "${TOKEN}" | docker login ghcr.io -u "${GITHUB_USERNAME}" --password-stdin 2>/dev/null || true
fi

IMAGE_TAG="${REGISTRY}:${VERSION}"
print_info "Building Docker image: ${IMAGE_TAG} (linux/amd64)"
docker build --platform linux/amd64 -t "${IMAGE_TAG}" .

if [ "${3:-}" = "build-only" ] || [ "${3:-}" = "--build-only" ]; then
    print_info "Build only. Image: ${IMAGE_TAG}"
    exit 0
fi

print_info "Pushing image..."
docker push "${IMAGE_TAG}"

print_info "Deploying to Kubernetes..."
"${SCRIPT_DIR}/k8s/deploy.sh" "${REGISTRY}" "${VERSION}" "multi-user"

print_info "Done: https://multi-user.showroom.lumegalabs.com/"
