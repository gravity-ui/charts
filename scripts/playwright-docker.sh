#!/usr/bin/env bash

set -euo pipefail

IMAGE_NAME="mcr.microsoft.com/playwright"
IMAGE_TAG="v1.56.1-jammy" # This version have to be synchronized with playwright version from package.json

NODE_MODULES_CACHE_BASE="$HOME/.cache/uikit-playwright-docker-node-modules"
REACT_VERSION="${REACT_VERSION:-}"

if [[ -n "$REACT_VERSION" ]]; then
  if [[ "$REACT_VERSION" != "17" && "$REACT_VERSION" != "19" ]]; then
    echo "REACT_VERSION must be one of: 17, 19 (got: $REACT_VERSION)"
    exit 1
  fi
  NODE_MODULES_CACHE_DIR="${NODE_MODULES_CACHE_BASE}-react${REACT_VERSION}"
else
  NODE_MODULES_CACHE_DIR="$NODE_MODULES_CACHE_BASE"
fi

command_exists() {
  command -v "$*" >/dev/null 2>&1
}

run_command() {
  TTY_FLAG=$([ -t 0 ] && echo "-it" || echo "-i")
  $CONTAINER_TOOL run --rm --network host $TTY_FLAG -w /work \
    --memory=4g --shm-size=1g \
    -v $(pwd):/work \
    -v "$NODE_MODULES_CACHE_DIR:/work/node_modules" \
    -e IS_DOCKER=1 \
    -e "REACT_VERSION=$REACT_VERSION" \
    "$IMAGE_NAME:$IMAGE_TAG" \
    /bin/bash -c "$*"
}

if command_exists docker; then
  CONTAINER_TOOL="docker"
elif command_exists podman; then
  CONTAINER_TOOL="podman"
else
  echo "Neither Docker nor Podman is installed on the system."
  exit 1
fi

if [[ "$*" = "clear-cache" ]]; then
  rm -rf "$NODE_MODULES_CACHE_BASE" "${NODE_MODULES_CACHE_BASE}"-react*
  rm -rf "./playwright/.cache-docker"
  exit 0
fi

if [[ ! -d "$NODE_MODULES_CACHE_DIR" ]]; then
  mkdir -p "$NODE_MODULES_CACHE_DIR"
  run_command 'npm ci'
  if [[ -n "$REACT_VERSION" ]]; then
    run_command "node scripts/install-react.mjs $REACT_VERSION"
  fi
fi

if [ $# -gt 1 ]; then
  run_command "$1 -- $(printf '%q ' "${@:2}")"
else
  run_command "$1"
fi
