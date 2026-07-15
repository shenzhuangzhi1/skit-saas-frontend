#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workflow="${repo_root}/.github/workflows/cicd.yml"
activation="${repo_root}/deploy/activate-frontend.sh"
release_env_cleanup="${repo_root}/deploy/cleanup-frontend-release-env.sh"
known_hosts="${repo_root}/deploy/known_hosts"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

grep -Fq "if: github.ref == 'refs/heads/master'" "${workflow}" \
  || fail "manual frontend deployment is not restricted to master"
if grep -Fq 'ssh-keyscan' "${workflow}"; then
  fail "frontend deployment still trusts a network-discovered SSH host key"
fi
grep -Fq 'install -m 600 deploy/known_hosts ~/.ssh/known_hosts' "${workflow}" \
  || fail "frontend deployment does not install the pinned SSH host key"
[[ -s "${known_hosts}" ]] || fail "pinned frontend SSH known_hosts file is missing"
grep -Fq '124.221.50.30 ssh-ed25519 ' "${known_hosts}" \
  || fail "pinned frontend SSH host key does not cover the production host"

grep -Eq 'RELEASE_ID: \$\{\{ github\.sha \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}' "${workflow}" \
  || fail "frontend release staging is not bound to commit, workflow run, and rerun attempt"
grep -Fq 'releases/frontend-${RELEASE_ID}' "${workflow}" \
  || fail "frontend artifacts do not use the run-unique release identifier"
if grep -Fq 'releases/frontend-${IMAGE_TAG}' "${workflow}"; then
  fail "frontend release staging can be reused across reruns of the same commit"
fi
grep -Eq 'mkdir -p .*DEPLOY_PATH.*/releases.*&& mkdir -- .*RELEASE_BUNDLE_PATH' "${workflow}" \
  || fail "frontend upload does not atomically reject an existing release directory"
for secret_argv_binding in \
  'GHCR_TOKEN=${GHCR_TOKEN_Q}' \
  'SUDO_PASSWORD=${SUDO_PASSWORD_Q}'; do
  if grep -Fq "${secret_argv_binding}" "${workflow}"; then
    fail "frontend remote SSH argv contains ${secret_argv_binding%%=*}"
  fi
done
grep -Fq 'chmod 600 .deploy/server.env' "${workflow}" \
  || fail "local frontend server.env is not protected before upload"
grep -Fq 'rm -f .deploy/server.env' "${workflow}" \
  || fail "local frontend server.env is not removed on every exit"
for staged_secret in GHCR_TOKEN SUDO_PASSWORD; do
  grep -Fq "printf '${staged_secret}=%q\\n'" "${workflow}" \
    || fail "frontend ${staged_secret} is not staged in the protected release environment"
done

[[ -x "${release_env_cleanup}" ]] \
  || fail "run-scoped frontend server.env cleanup helper is missing"
bash -n "${release_env_cleanup}" \
  || fail "run-scoped frontend server.env cleanup helper has invalid shell syntax"
cleanup_test_root="$(mktemp -d)"
cleanup_test_release="dddddddddddddddddddddddddddddddddddddddd-12345-1"
cleanup_other_attempt="dddddddddddddddddddddddddddddddddddddddd-12345-2"
cleanup_other_run="dddddddddddddddddddddddddddddddddddddddd-54321-1"
cleanup_test_finish() {
  rm -rf "${cleanup_test_root}"
}
trap cleanup_test_finish EXIT
mkdir -p \
  "${cleanup_test_root}/releases/frontend-${cleanup_test_release}" \
  "${cleanup_test_root}/releases/frontend-${cleanup_other_attempt}" \
  "${cleanup_test_root}/releases/frontend-${cleanup_other_run}"
printf 'target\n' > "${cleanup_test_root}/releases/frontend-${cleanup_test_release}/server.env"
printf 'other-attempt\n' > "${cleanup_test_root}/releases/frontend-${cleanup_other_attempt}/server.env"
printf 'other-run\n' > "${cleanup_test_root}/releases/frontend-${cleanup_other_run}/server.env"
DEPLOY_PATH="${cleanup_test_root}" RELEASE_ID="${cleanup_test_release}" \
  "${release_env_cleanup}"
[[ ! -e "${cleanup_test_root}/releases/frontend-${cleanup_test_release}/server.env" ]] \
  || fail "run-scoped cleanup retained this frontend attempt's server.env"
[[ -e "${cleanup_test_root}/releases/frontend-${cleanup_other_attempt}/server.env" ]] \
  || fail "run-scoped cleanup removed another frontend rerun attempt's server.env"
[[ -e "${cleanup_test_root}/releases/frontend-${cleanup_other_run}/server.env" ]] \
  || fail "run-scoped cleanup removed another frontend workflow run's server.env"

grep -Fq '.deploy/cleanup-frontend-release-env.sh' "${workflow}" \
  || fail "frontend release does not stage the run-scoped cleanup helper"
grep -Fq 'cleanup_remote_server_env() {' "${workflow}" \
  || fail "frontend remote activation has no early server.env cleanup wrapper"
grep -Fq "if: always() && steps.deploy_config.outputs.enabled == 'true'" "${workflow}" \
  || fail "frontend has no independent always-run remote secret cleanup"
grep -Fq 'DEPLOY_PATH=${DEPLOY_PATH_Q} RELEASE_ID=${RELEASE_ID_Q} bash ${REMOTE_CLEANUP_SCRIPT_Q}' "${workflow}" \
  || fail "independent frontend cleanup is not scoped to this release ID"

secret_unlink_line="$(grep -nF 'rm -f -- "${server_env_file}"' "${activation}" | tail -n 1 | cut -d: -f1 || true)"
secret_source_line="$(grep -nF -m 1 '. "${server_env_file}"' "${activation}" | cut -d: -f1 || true)"
docker_access_line="$(grep -nF -m 1 'prepare_docker_access' "${activation}" | tail -n 1 | cut -d: -f1 || true)"
[[ -n "${secret_source_line}" && -n "${secret_unlink_line}" && -n "${docker_access_line}" ]] \
  || fail "frontend activation does not source, unlink, and then consume release secrets"
(( secret_source_line < secret_unlink_line && secret_unlink_line < docker_access_line )) \
  || fail "frontend release environment is not unlinked immediately after sourcing"
grep -Fq '.deploy.lock' "${activation}" \
  || fail "frontend activation does not share the deployment lock"
grep -Fq 'flock -w' "${activation}" \
  || fail "frontend activation does not wait for the deployment lock"
if grep -Fq '. ./server.env' "${activation}"; then
  fail "frontend activation can consume a backend secret staging file"
fi
grep -Fq './deploy/test-release-security.sh' "${workflow}" \
  || fail "frontend CI does not run the release-security contract"

echo "PASS: frontend release security contracts are enforced"
