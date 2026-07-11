#!/usr/bin/env bash
# Poll a URL until HTTP 2xx/3xx or timeout. No sleep between attempts beyond curl's own timeout.
set -euo pipefail

URL="${1:?URL required}"
TIMEOUT_SEC="${2:-120}"
INTERVAL_SEC="${3:-2}"

deadline=$((SECONDS + TIMEOUT_SEC))

while (( SECONDS < deadline )); do
  if curl -sf --max-time 5 "$URL" > /dev/null; then
    echo "OK: $URL"
    exit 0
  fi
  # Poll interval — not a fixed startup delay; exits as soon as the endpoint is healthy.
  sleep "$INTERVAL_SEC"
done

echo "TIMEOUT: $URL not healthy within ${TIMEOUT_SEC}s" >&2
exit 1
