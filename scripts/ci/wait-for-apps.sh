#!/usr/bin/env bash
# Wait until API, Admin, and Storefront health endpoints respond.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

bash "$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:4000/api/v1/health" 180

# API health must report database + redis up
health_json="$(curl -sf http://localhost:4000/api/v1/health)"
echo "$health_json" | grep -q '"database":"up"' || {
  echo "API health: database not up — $health_json" >&2
  exit 1
}
echo "$health_json" | grep -q '"redis":"up"' || {
  echo "API health: redis not up — $health_json" >&2
  exit 1
}

bash "$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:3001" 180
bash "$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:3000/ar" 180

echo "All application servers are ready."
