#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace="$(mktemp -d)"
trap 'rm -rf "${workspace}"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

prepare_workspace() {
  rm -rf "${workspace:?}/stack" "${workspace:?}/bin" "${workspace:?}/calls.log"
  mkdir -p "${workspace}/stack" "${workspace}/bin"
  cp "${repo_root}/deploy/activate-frontend.sh" "${workspace}/stack/activate-frontend.sh"
  chmod +x "${workspace}/stack/activate-frontend.sh"
  touch "${workspace}/stack/docker-compose.prod.yml"

  cat > "${workspace}/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "${FAKE_DOCKER_CALLS}"

case "$*" in
  "version"|"compose version")
    exit 0
    ;;
  "inspect --format {{.Config.Image}} skit-saas-frontend")
    printf '%s\n' "${FAKE_FRONTEND_IMAGE}"
    exit 0
    ;;
esac
EOF
  chmod +x "${workspace}/bin/docker"

  cat > "${workspace}/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf 'curl %s\n' "$*" >> "${FAKE_DOCKER_CALLS}"
exit "${FAKE_CURL_EXIT}"
EOF
  chmod +x "${workspace}/bin/curl"

  cat > "${workspace}/bin/sleep" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
  chmod +x "${workspace}/bin/sleep"
}

run_activation() {
  local actual_image="$1"
  local curl_exit="$2"
  PATH="${workspace}/bin:${PATH}" \
    FAKE_DOCKER_CALLS="${workspace}/calls.log" \
    FAKE_FRONTEND_IMAGE="${actual_image}" \
    FAKE_CURL_EXIT="${curl_exit}" \
    DEPLOY_PATH="${workspace}/stack" \
    IMAGE_NAME="ghcr.io/example/skit-saas-frontend" \
    IMAGE_TAG="release-sha" \
    GHCR_USERNAME="example" \
    GHCR_TOKEN="registry-token" \
    FRONTEND_PORT="18080" \
    bash "${workspace}/stack/activate-frontend.sh"
}

expected_image="ghcr.io/example/skit-saas-frontend:release-sha"

prepare_workspace
run_activation "${expected_image}" 0 \
  || fail "expected a healthy frontend-only activation to succeed"

grep -Fx 'compose -f docker-compose.prod.yml --env-file .env pull frontend' "${workspace}/calls.log" \
  || fail "frontend image was not pulled explicitly"
grep -Fx 'compose -f docker-compose.prod.yml --env-file .env up -d --no-deps --force-recreate frontend' "${workspace}/calls.log" \
  || fail "frontend was not recreated independently"
if grep -Fq 'backend' "${workspace}/calls.log"; then
  fail "frontend activation touched backend"
fi

prepare_workspace
if run_activation "ghcr.io/example/skit-saas-frontend:stale-sha" 0; then
  fail "stale frontend image was accepted"
fi

prepare_workspace
if run_activation "${expected_image}" 22; then
  fail "unhealthy frontend endpoint was accepted"
fi

echo "PASS: frontend rollout is isolated and verified"
