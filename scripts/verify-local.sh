#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${repo_root}"

command -v node >/dev/null 2>&1 || { echo "Install Node.js 22+ before frontend verification." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Install pnpm 10+ before frontend verification." >&2; exit 1; }

stash_before="$(git rev-parse -q --verify refs/stash 2>/dev/null || true)"
stash_marker=""
restore_worktree() {
  if [[ -n "${stash_marker}" ]]; then
    git stash pop --index "${stash_marker}" >/dev/null
  fi
}
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  git stash push --include-untracked --keep-index -m "skit-local-verify" >/dev/null
  stash_after="$(git rev-parse -q --verify refs/stash 2>/dev/null || true)"
  if [[ "${stash_after}" != "${stash_before}" ]]; then
    stash_marker="${stash_after}"
    trap restore_worktree EXIT HUP INT TERM
  fi
fi

pnpm install --frozen-lockfile
pnpm test:unit
pnpm ts:check
pnpm lint
pnpm build:prod
echo "Frontend local verification passed."
