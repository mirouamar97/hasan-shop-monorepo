#!/usr/bin/env bash
# Full CI pipeline — mirrors .github/workflows/ci.yml for local / clean-machine runs.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export CI=true
export NODE_ENV=test

cleanup() {
  bash "$ROOT/scripts/ci/stop-ci.sh" || true
}
trap cleanup EXIT

echo "=== 1. Install dependencies ==="
pnpm install --frozen-lockfile

echo "=== 2. Lint & typecheck ==="
pnpm lint
pnpm typecheck

echo "=== 3. Build all packages ==="
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:4000}" pnpm build

echo "=== 4. Environment ==="
cp -n .env.example .env 2>/dev/null || cp .env.example .env

echo "=== 5. Start Docker (health-checked services) ==="
docker compose up -d --wait --wait-timeout 180 postgres redis meilisearch minio

echo "=== 6. Verify infrastructure health ==="
bash "$ROOT/scripts/ci/verify-docker-health.sh"

echo "=== 7. Migrate & seed ==="
pnpm db:migrate
SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-DevOnly@HasanShop2026!Secure}" pnpm db:seed

echo "=== 8. Start applications ==="
bash "$ROOT/scripts/ci/start-apps.sh"
bash "$ROOT/scripts/ci/wait-for-apps.sh"

echo "=== 9. Dependency audit ==="
pnpm audit --audit-level=high

echo "=== 10. Unit tests + coverage (all packages except e2e) ==="
pnpm test:coverage

echo "=== 11. API integration tests (must not skip in CI) ==="
VITEST_INTEGRATION=true pnpm test:integration

echo "=== 11. Playwright E2E ==="
pnpm --filter @hasan-shop/e2e exec playwright install --with-deps chromium
pnpm test:e2e:ci

echo "=== CI pipeline completed successfully ==="
