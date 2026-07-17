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
generic_block="$(tail -n "+${generic_line}" "${nginx_config}" | sed -n '1,/^  }$/p')"
grep -Eq '^    access_log off;$' <<<"${callback_block}" \
  || fail "callback access logging must be disabled"
grep -Eq '^    error_log /dev/null crit;$' <<<"${callback_block}" \
  || fail "callback upstream errors must not echo the secret route or query"
grep -Eq '^    proxy_pass http://backend:48080;$' <<<"${callback_block}" \
  || fail "proxy_pass must omit a replacement URI so the untouched path and query reach backend"
grep -Fq 'map $http_x_real_ip $skit_client_ip {' "${nginx_config}" \
  || fail "loopback frontend must retain the TLS proxy's canonical client IP"
grep -Fq 'map $http_x_forwarded_for $skit_forwarded_for {' "${nginx_config}" \
  || fail "loopback frontend must retain the TLS proxy's canonical forwarding chain"
grep -Eq '^    proxy_set_header X-Real-IP \$skit_client_ip;$' <<<"${callback_block}" \
  || fail "callback proxy must forward the canonical client IP"
grep -Eq '^    proxy_set_header X-Forwarded-For \$skit_forwarded_for;$' <<<"${callback_block}" \
  || fail "callback proxy must forward the canonical forwarding chain"
grep -Eq '^    proxy_set_header X-Real-IP \$skit_client_ip;$' <<<"${generic_block}" \
  || fail "generic API proxy must forward the canonical client IP"
grep -Eq '^    proxy_set_header X-Forwarded-For \$skit_forwarded_for;$' <<<"${generic_block}" \
  || fail "generic API proxy must forward the canonical forwarding chain"
! grep -Fq '$proxy_add_x_forwarded_for' <<<"${generic_block}" \
  || fail "generic API proxy must never append an untrusted forwarding chain"

echo "PASS: callback logs are secret-safe and public proxy client headers are retained"
