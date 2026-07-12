#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${IMAGE_NAME:?IMAGE_NAME is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

cd "${DEPLOY_PATH}"

if [ ! -f docker-compose.prod.yml ]; then
  echo "docker-compose.prod.yml is missing. Run the backend deployment first."
  exit 1
fi

if grep -q 'image: skit-saas-frontend:${FRONTEND_IMAGE_TAG:-latest}' docker-compose.prod.yml; then
  sed -i 's|image: skit-saas-frontend:${FRONTEND_IMAGE_TAG:-latest}|image: ${FRONTEND_IMAGE:-skit-saas-frontend}:${FRONTEND_IMAGE_TAG:-latest}|' docker-compose.prod.yml
fi

set -a
if [ -f server.env ]; then
  # shellcheck disable=SC1091
  . ./server.env
fi
set +a

upsert_env() {
  key="$1"
  value="$2"
  temp_file="$(mktemp)"
  if [ -f .env ]; then
    grep -v "^${key}=" .env > "${temp_file}" || true
  fi
  printf '%s=%s\n' "${key}" "${value}" >> "${temp_file}"
  mv "${temp_file}" .env
  chmod 600 .env
}

DOCKER_USE_SUDO=0
DOCKER_SUDO_PASSWORD=0

sudo_cmd() {
  if [ "${DOCKER_SUDO_PASSWORD}" = "1" ]; then
    printf '%s\n' "${SUDO_PASSWORD}" | sudo -S -p '' "$@"
  else
    sudo -n "$@"
  fi
}

docker_cmd() {
  if [ "${DOCKER_USE_SUDO}" = "1" ]; then
    if [ -n "${DOCKER_CONFIG:-}" ]; then
      sudo_cmd env DOCKER_CONFIG="${DOCKER_CONFIG}" docker "$@"
    else
      sudo_cmd docker "$@"
    fi
  else
    docker "$@"
  fi
}

compose_cmd() {
  if [ "${DOCKER_USE_SUDO}" = "1" ]; then
    if [ -n "${DOCKER_CONFIG:-}" ]; then
      sudo_cmd env DOCKER_CONFIG="${DOCKER_CONFIG}" docker-compose "$@"
    else
      sudo_cmd docker-compose "$@"
    fi
  else
    docker-compose "$@"
  fi
}

prepare_docker_access() {
  if docker version >/dev/null 2>&1; then
    return
  fi
  if command -v sudo >/dev/null 2>&1 && sudo -n docker version >/dev/null 2>&1; then
    DOCKER_USE_SUDO=1
    return
  fi
  if [ -n "${SUDO_PASSWORD:-}" ] && command -v sudo >/dev/null 2>&1 \
    && printf '%s\n' "${SUDO_PASSWORD}" | sudo -S -p '' docker version >/dev/null 2>&1; then
    DOCKER_USE_SUDO=1
    DOCKER_SUDO_PASSWORD=1
    return
  fi
  echo "Docker is not accessible for this SSH user. Add the user to the docker group or configure sudo access."
  exit 1
}

compose() {
  if docker_cmd compose version >/dev/null 2>&1; then
    docker_cmd compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    compose_cmd "$@"
  else
    echo "Docker Compose is not installed."
    exit 1
  fi
}

prepare_docker_access

docker_config=""
if [ -n "${GHCR_TOKEN:-}" ]; then
  docker_config="$(mktemp -d)"
  export DOCKER_CONFIG="${docker_config}"
  printf '%s' "${GHCR_TOKEN}" | docker_cmd login ghcr.io -u "${GHCR_USERNAME:-github-actions}" --password-stdin
  trap 'rm -rf "${docker_config}"' EXIT
fi

upsert_env FRONTEND_IMAGE "${IMAGE_NAME}"
upsert_env FRONTEND_IMAGE_TAG "${IMAGE_TAG}"
upsert_env FRONTEND_PORT "${FRONTEND_PORT:-80}"

compose -f docker-compose.prod.yml --env-file .env pull frontend
compose -f docker-compose.prod.yml --env-file .env up -d --no-deps --force-recreate frontend

expected_image="${IMAGE_NAME}:${IMAGE_TAG}"
actual_image="$(docker_cmd inspect --format '{{.Config.Image}}' skit-saas-frontend)"
if [ "${actual_image}" != "${expected_image}" ]; then
  echo "Frontend container image mismatch: expected ${expected_image}, got ${actual_image}"
  exit 1
fi

for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${FRONTEND_PORT:-80}/" >/dev/null; then
    docker_cmd ps --filter name=skit-saas-frontend
    exit 0
  fi
  sleep 2
done

docker_cmd logs --tail 80 skit-saas-frontend || true
exit 1
