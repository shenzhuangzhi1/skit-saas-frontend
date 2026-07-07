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

set -a
if [ -f server.env ]; then
  # shellcheck disable=SC1091
  . ./server.env
fi
set +a

upsert_env() {
  key="$1"
  value="$2"
  touch .env
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    printf '%s=%s\n' "${key}" "${value}" >> .env
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

mkdir -p images
if [ -f "${IMAGE_NAME}-${IMAGE_TAG}.tar.gz" ]; then
  mv "${IMAGE_NAME}-${IMAGE_TAG}.tar.gz" "images/${IMAGE_NAME}-${IMAGE_TAG}.tar.gz"
fi

gzip -dc "images/${IMAGE_NAME}-${IMAGE_TAG}.tar.gz" | docker load

upsert_env FRONTEND_IMAGE_TAG "${IMAGE_TAG}"
upsert_env FRONTEND_PORT "${FRONTEND_PORT:-80}"

compose -f docker-compose.prod.yml --env-file .env up -d frontend

for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${FRONTEND_PORT:-80}/" >/dev/null; then
    docker ps --filter name=skit-saas-frontend
    exit 0
  fi
  sleep 2
done

docker logs --tail 80 skit-saas-frontend || true
exit 1
