#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${IMAGE_NAME:?IMAGE_NAME is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

cd "${DEPLOY_PATH}"

docker_config=""
portable_lock_dir=""
server_env_file=""
cleanup_server_env=0

cleanup() {
  exit_code=$?
  trap - EXIT
  if [ -n "${docker_config}" ]; then
    rm -rf "${docker_config}"
  fi
  if [ "${cleanup_server_env}" = "1" ] && [ -n "${server_env_file}" ]; then
    rm -f -- "${server_env_file}"
  fi
  if [ -n "${portable_lock_dir}" ]; then
    rmdir "${portable_lock_dir}" >/dev/null 2>&1 || true
  fi
  exit "${exit_code}"
}
trap cleanup EXIT

release_bundle_path="${RELEASE_BUNDLE_PATH:-}"
if [ -n "${release_bundle_path}" ]; then
  if [[ ! "${release_bundle_path}" =~ ^releases/frontend-[0-9A-Fa-f]{40}-[0-9]+-[0-9]+$ ]] ||
     [ -L "${release_bundle_path}" ] || [ ! -d "${release_bundle_path}" ]; then
    echo "RELEASE_BUNDLE_PATH must identify a safe staged frontend release."
    exit 1
  fi
  server_env_file="${release_bundle_path}/server.env"
  cleanup_server_env=1
  if [ -L "${server_env_file}" ] || [ ! -f "${server_env_file}" ]; then
    echo "The staged frontend release environment is missing or unsafe."
    exit 1
  fi
  chmod 600 "${server_env_file}"
  # shellcheck disable=SC1090
  . "${server_env_file}"
  rm -f -- "${server_env_file}"
  cleanup_server_env=0
  server_env_file=""
fi

deploy_lock_wait_seconds="${SKIT_DEPLOY_LOCK_WAIT_SECONDS:-900}"
if [[ ! "${deploy_lock_wait_seconds}" =~ ^[0-9]+$ ]]; then
  echo "SKIT_DEPLOY_LOCK_WAIT_SECONDS must be a non-negative integer."
  exit 1
fi
if command -v flock >/dev/null 2>&1; then
  exec 9> .deploy.lock
  if ! flock -w "${deploy_lock_wait_seconds}" 9; then
    echo "Another backend or frontend activation holds ${DEPLOY_PATH}/.deploy.lock."
    exit 1
  fi
else
  portable_lock_dir=".deploy.lock.d"
  lock_deadline=$((SECONDS + deploy_lock_wait_seconds))
  until mkdir "${portable_lock_dir}" 2>/dev/null; do
    if [ "${SECONDS}" -ge "${lock_deadline}" ]; then
      portable_lock_dir=""
      echo "Another backend or frontend activation holds ${DEPLOY_PATH}/.deploy.lock."
      exit 1
    fi
    sleep 1
  done
fi

if [ ! -f docker-compose.prod.yml ]; then
  echo "docker-compose.prod.yml is missing. Run the backend deployment first."
  exit 1
fi

if grep -q 'image: skit-saas-frontend:${FRONTEND_IMAGE_TAG:-latest}' docker-compose.prod.yml; then
  sed -i 's|image: skit-saas-frontend:${FRONTEND_IMAGE_TAG:-latest}|image: ${FRONTEND_IMAGE:-skit-saas-frontend}:${FRONTEND_IMAGE_TAG:-latest}|' docker-compose.prod.yml
fi

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

if [ -n "${GHCR_TOKEN:-}" ]; then
  docker_config="$(mktemp -d)"
  export DOCKER_CONFIG="${docker_config}"
  printf '%s' "${GHCR_TOKEN}" | docker_cmd login ghcr.io -u "${GHCR_USERNAME:-github-actions}" --password-stdin
  unset GHCR_TOKEN
fi

upsert_env FRONTEND_IMAGE "${IMAGE_NAME}"
upsert_env FRONTEND_IMAGE_TAG "${IMAGE_TAG}"
upsert_env FRONTEND_PORT "${FRONTEND_PORT:-48081}"

compose -f docker-compose.prod.yml --env-file .env pull frontend
compose -f docker-compose.prod.yml --env-file .env up -d --no-deps --force-recreate frontend

expected_image="${IMAGE_NAME}:${IMAGE_TAG}"
actual_image="$(docker_cmd inspect --format '{{.Config.Image}}' skit-saas-frontend)"
if [ "${actual_image}" != "${expected_image}" ]; then
  echo "Frontend container image mismatch: expected ${expected_image}, got ${actual_image}"
  exit 1
fi

for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${FRONTEND_PORT:-48081}/" >/dev/null; then
    docker_cmd ps --filter name=skit-saas-frontend
    exit 0
  fi
  sleep 2
done

docker_cmd logs --tail 80 skit-saas-frontend || true
exit 1
