#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
nginx_config="${repo_root}/deploy/nginx.conf"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

callback_location='location ^~ /app-api/skit/ad-callback/taku/ {'
callback_line="$(grep -nF "${callback_location}" "${nginx_config}" | cut -d: -f1 || true)"
[ -n "${callback_line}" ] || fail "dedicated Taku callback location is missing"

generic_line="$(grep -nF 'location ~ ^/(admin-api|app-api|' "${nginx_config}" | cut -d: -f1 || true)"
[ -n "${generic_line}" ] || fail "generic API proxy location is missing"
[ "${callback_line}" -lt "${generic_line}" ] \
  || fail "callback location must precede the generic regex location"

callback_block="$(tail -n "+${callback_line}" "${nginx_config}" | sed -n '1,/^  }$/p')"
grep -Eq '^    access_log off;$' <<<"${callback_block}" \
  || fail "callback access logging must be disabled"
grep -Eq '^    error_log /dev/null crit;$' <<<"${callback_block}" \
  || fail "callback upstream errors must not echo the secret route or query"
grep -Eq '^    proxy_pass http://backend:48080;$' <<<"${callback_block}" \
  || fail "proxy_pass must omit a replacement URI so the untouched path and query reach backend"
grep -Eq '^    proxy_set_header X-Real-IP \$remote_addr;$' <<<"${callback_block}" \
  || fail "callback proxy must overwrite X-Real-IP with the direct peer"
grep -Eq '^    proxy_set_header X-Forwarded-For \$remote_addr;$' <<<"${callback_block}" \
  || fail "callback proxy must discard caller-supplied forwarding chains"

echo "PASS: callback key/query are excluded from Nginx access logs and forwarded unchanged"
