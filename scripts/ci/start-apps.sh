#!/usr/bin/env bash
# Start API, Admin, and Storefront in production mode (after pnpm build).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

LOG_DIR="${CI_LOG_DIR:-$ROOT/ci-logs}"
mkdir -p "$LOG_DIR"

export NODE_ENV="${NODE_ENV:-test}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:4000}"

if [[ ! -f "$ROOT/.env" ]]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

# shellcheck disable=SC1091
set -a
source "$ROOT/.env"
set +a

export DATABASE_URL="${DATABASE_URL:-postgresql://hasan_shop:hasan_shop_dev@localhost:5433/hasan_shop}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
export MEILISEARCH_HOST="${MEILISEARCH_HOST:-http://localhost:7700}"
export MEILISEARCH_API_KEY="${MEILISEARCH_API_KEY:-hasan_shop_meili_dev_key}"
export AUTH_SECRET="${AUTH_SECRET:-ci-auth-secret-minimum-32-characters-long}"
export SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-DevOnly@HasanShop2026!Secure}"

start_proc() {
  local name="$1"
  shift
  echo "Starting $name..."
  "$@" >"$LOG_DIR/${name}.log" 2>&1 &
  echo $! >"$LOG_DIR/${name}.pid"
}

start_proc api pnpm --filter @hasan-shop/api start
start_proc admin pnpm --filter @hasan-shop/admin start
start_proc storefront pnpm --filter @hasan-shop/storefront start

echo "Application PIDs written to $LOG_DIR/*.pid"
