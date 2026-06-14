#!/usr/bin/env bash
# Deploy multi-user-frontend to Kubernetes (Rancher cluster).
# Usage: ./deploy.sh [image-registry] [image-tag] [namespace]
# Example: ./deploy.sh ghcr.io/nishantshaklan/multi-user-frontend latest multi-user

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v kubectl >/dev/null 2>&1; then
    KUBECTL_MAC_BIN="/Applications/Docker.app/Contents/Resources/bin"
    if [ -x "${KUBECTL_MAC_BIN}/kubectl" ]; then
        export PATH="${KUBECTL_MAC_BIN}:${PATH}"
    fi
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

IMAGE_REGISTRY=${1:-"ghcr.io/nishantshaklan/multi-user-frontend"}
IMAGE_TAG=${2:-"latest"}
NAMESPACE=${3:-"multi-user"}

print_info "=========================================="
print_info "Multi User Frontend Deployment"
print_info "=========================================="
print_info "Image: ${IMAGE_REGISTRY}:${IMAGE_TAG}"
print_info "Namespace: ${NAMESPACE}"
print_info ""

if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
    print_info "Creating namespace: ${NAMESPACE}"
    kubectl create namespace "${NAMESPACE}"
else
    print_info "Namespace ${NAMESPACE} already exists"
fi

if ! kubectl get secret ghcr-secret -n "${NAMESPACE}" &> /dev/null; then
    print_warn "No ghcr-secret found in namespace ${NAMESPACE}"
    print_warn "Create one before deploying if image pulls fail."
fi

kubectl config set-context --current --namespace="${NAMESPACE}"

print_info "Applying ConfigMap..."
kubectl apply -f "${SCRIPT_DIR}/configmap.yaml"

print_info "Applying Deployment and Service..."
sed "s|image:.*multi-user-frontend.*|image: ${IMAGE_REGISTRY}:${IMAGE_TAG}|g" \
    "${SCRIPT_DIR}/deployment.yaml" | kubectl apply -f -
kubectl apply -f "${SCRIPT_DIR}/service.yaml"

print_info "Applying Ingress..."
kubectl apply -f "${SCRIPT_DIR}/ingress.yaml"

print_info "Restarting rollout..."
kubectl rollout restart deployment/multi-user-frontend -n "${NAMESPACE}"

print_info "Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/multi-user-frontend -n "${NAMESPACE}" || {
    print_error "Deployment failed to become ready"
    kubectl get pods -n "${NAMESPACE}" -l app=multi-user-frontend
    exit 1
}

print_info ""
print_info "=========================================="
print_info "Deployment complete!"
print_info "=========================================="
kubectl get deployment multi-user-frontend -n "${NAMESPACE}"
kubectl get pods -n "${NAMESPACE}" -l app=multi-user-frontend
kubectl get svc multi-user-frontend -n "${NAMESPACE}"
kubectl get ingress multi-user-frontend-ingress -n "${NAMESPACE}"
print_info ""
print_info "URL: https://multi-user.showroom.lumegalabs.com/"
