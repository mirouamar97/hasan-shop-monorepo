#!/usr/bin/env bash
# Validate production deployment health (polls until ready or timeout)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE=".env.production"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# shellcheck disable=SC1090
set -a
source "$ROOT/$ENV_FILE"
set +a

API_URL="${API_URL:-http://localhost:4000}"
STORE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3001}"
TIMEOUT=300

wait_url() {
  local url="$1"
  local deadline=$((SECONDS + TIMEOUT))
  while (( SECONDS < deadline )); do
    if curl -sf --max-time 5 "$url" > /dev/null; then
      echo "OK: $url"
      return 0
    fi
    sleep 2
  done
  echo "FAIL: $url not ready within ${TIMEOUT}s" >&2
  return 1
}

echo "Validating API..."
wait_url "${API_URL}/api/v1/health"

health="$(curl -sf "${API_URL}/api/v1/health")"
echo "$health" | grep -q '"database":"up"' || { echo "database down"; exit 1; }
echo "$health" | grep -q '"redis":"up"' || { echo "redis down"; exit 1; }

echo "Validating storefront..."
wait_url "${STORE_URL}/ar"

echo "Validating admin..."
wait_url "${ADMIN_URL}/"

echo "Validating SEO assets..."
wait_url "${STORE_URL}/robots.txt"
wait_url "${STORE_URL}/sitemap.xml"
wait_url "${STORE_URL}/favicon.svg"

echo "All deployment health checks passed."
