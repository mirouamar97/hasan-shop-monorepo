# CI Pipeline

Production-grade continuous integration for HASAN SHOP. The pipeline boots the full stack automatically, uses health checks (never fixed `sleep` delays), runs every test layer, and uploads artifacts. No E2E tests are skipped.

## Entry points

| Command | Where it runs |
|---------|---------------|
| `pnpm ci` | Local / clean machine — `scripts/ci/run-ci.mjs` (PowerShell on Windows, bash on Linux/macOS) |
| `pnpm ci:bash` | Force bash script (Linux/macOS / Git Bash) |
| `pnpm ci:ps1` | Force PowerShell script (Windows) |
| GitHub Actions | `.github/workflows/ci.yml` — triggers on push/PR to `main`, `master`, `develop` |

Both paths execute the same steps in the same order.

---

## Pipeline overview

```mermaid
flowchart TD
  A[Install dependencies] --> B[Lint + Typecheck]
  B --> C[Build all packages]
  C --> D[Create .env]
  D --> E[Start Docker services]
  E --> F[Verify infrastructure health]
  F --> G[Database migrate + seed]
  G --> H[Start API / Admin / Storefront]
  H --> I[Wait for app health endpoints]
  I --> J[Unit tests + coverage]
  J --> K[API integration tests]
  K --> L[Playwright E2E suite]
  L --> M[Upload artifacts]
  M --> N[Stop CI stack]
```

---

## Step-by-step

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

Locks the dependency graph to `pnpm-lock.yaml` for reproducible builds.

### 2. Lint and typecheck

```bash
pnpm lint
pnpm typecheck
```

Runs ESLint and TypeScript across all workspace packages via Turborepo.

### 3. Build every package

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm build
```

Builds API (`nest build`), Admin/Storefront (`next build`), and all shared packages. Frontends embed the API URL at build time.

### 4. Environment configuration

```bash
cp .env.example .env
```

CI sets additional variables (see [Environment variables](#environment-variables)). GitHub Actions injects secrets-safe defaults in the workflow `env` block.

### 5. Start Docker automatically

```bash
docker compose up -d --wait --wait-timeout 180 postgres redis meilisearch minio
```

Services started:

| Service | Container | Port | Docker HEALTHCHECK |
|---------|-----------|------|-------------------|
| PostgreSQL 16 | `hasan-shop-postgres` | 5433 | `pg_isready` |
| Redis 7 | `hasan-shop-redis` | 6379 | `redis-cli ping` |
| Meilisearch 1.14 | `hasan-shop-meilisearch` | 7700 | `curl /health` |
| MinIO | `hasan-shop-minio` | 9000 / 9001 | Host HTTP probe (image has no curl) |

`--wait` blocks until health-checked containers report `healthy` (max 180 s).

### 6. Verify infrastructure health

```bash
bash scripts/ci/verify-docker-health.sh
```

**Script:** `scripts/ci/verify-docker-health.sh`

1. Asserts Docker health status for `postgres`, `redis`, `meilisearch`.
2. Confirms `hasan-shop-minio` container is running.
3. Polls HTTP endpoints via `scripts/ci/wait-for-url.sh`:
   - `http://localhost:7700/health`
   - `http://localhost:9000/minio/health/live`

**Health polling:** `scripts/ci/wait-for-url.sh` curls the URL every 2 s until HTTP 2xx/3xx or timeout. This is active polling, not a blind sleep.

### 7. Run database migrations

```bash
pnpm db:migrate
```

Applies Drizzle SQL migrations to PostgreSQL (`packages/database`).

### 8. Seed the database

```bash
pnpm db:seed
```

Seeds admin user, catalog, geo data, and operational fixtures. Default admin:

- Email: `admin@hasan-shop.dz`
- Password: `DevOnly@HasanShop2026!Secure` (from `SEED_ADMIN_PASSWORD`)

### 9. Start applications

```bash
bash scripts/ci/start-apps.sh
```

**Script:** `scripts/ci/start-apps.sh`

Starts production builds in the background:

| App | Command | Port | Log file |
|-----|---------|------|----------|
| API | `pnpm --filter @hasan-shop/api start` | 4000 | `ci-logs/api.log` |
| Admin | `pnpm --filter @hasan-shop/admin start` | 3001 | `ci-logs/admin.log` |
| Storefront | `pnpm --filter @hasan-shop/storefront start` | 3000 | `ci-logs/storefront.log` |

PIDs are written to `ci-logs/*.pid` for teardown.

### 10. Wait for application health endpoints

```bash
bash scripts/ci/wait-for-apps.sh
```

**Script:** `scripts/ci/wait-for-apps.sh`

| Check | URL | Validation |
|-------|-----|------------|
| API | `http://localhost:4000/api/v1/health` | `"database":"up"` and `"redis":"up"` in JSON |
| Admin | `http://localhost:3001` | HTTP 2xx |
| Storefront | `http://localhost:3000/ar` | HTTP 2xx |

Timeout: 180 s per endpoint.

### 11. Unit tests and coverage

```bash
pnpm test:coverage
```

Runs `test:ci` in all packages **except** `@hasan-shop/e2e` via Turborepo. API unit tests exclude `src/test/integration/**` so integration is not duplicated.

Coverage targets:

- API line coverage ≥ 85%
- Shared / carrier-adapters: 100%

### 12. API integration tests

```bash
pnpm test:integration
```

Runs `apps/api/src/test/integration/**` against the live PostgreSQL instance.

**CI policy:** Integration tests **never skip** when `CI=true`. If PostgreSQL is unreachable, the suite fails with an explicit error (`describeIfDatabase`).

### 13. Playwright E2E suite

```bash
pnpm --filter @hasan-shop/e2e exec playwright install --with-deps chromium
pnpm test:e2e:ci
```

**No skipped tests.** `global-setup.ts` verifies the stack is healthy in CI before any spec runs. Playwright config:

- Parallel execution (`fullyParallel: true`, 2 workers in CI)
- 2 retries in CI
- Screenshots on failure
- Video retained on failure
- Trace retained on failure (open with `npx playwright show-trace`)

See [TEST_STRATEGY.md](./TEST_STRATEGY.md) for E2E architecture (page objects, fixtures).

### 14. Generate artifacts

GitHub Actions uploads (always, even on failure):

| Artifact | Path | Retention |
|----------|------|-----------|
| `coverage-report` | `apps/api/coverage/`, `packages/shared/coverage/`, `packages/carrier-adapters/coverage/` | 14 days |
| `playwright-report` | `e2e/playwright-report/`, `e2e/test-results/` | 14 days |
| `ci-logs` | `ci-logs/` | 7 days |

### 15. Stop CI stack

```bash
bash scripts/ci/stop-ci.sh
```

Kills application PIDs and runs `docker compose down`. Executed via `trap` in `run-ci.sh` and `if: always()` in GitHub Actions.

---

## Environment variables

| Variable | CI value | Purpose |
|----------|----------|---------|
| `CI` | `true` | Fail-fast integration/E2E; enable Playwright retries |
| `NODE_ENV` | `test` | Runtime mode |
| `DATABASE_URL` | `postgresql://hasan_shop:hasan_shop_dev@localhost:5433/hasan_shop` | PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | Redis |
| `MEILISEARCH_HOST` | `http://localhost:7700` | Search |
| `MEILISEARCH_API_KEY` | `hasan_shop_meili_dev_key` | Search auth |
| `AUTH_SECRET` | 32+ char secret | Session signing |
| `SEED_ADMIN_PASSWORD` | `DevOnly@HasanShop2026!Secure` | Seed + E2E admin login |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Same as seed admin | Playwright admin tests |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Storefront → API |
| `CI_LOG_DIR` | `ci-logs/` | Application log output |

---

## Local prerequisites

1. **Node.js** ≥ 20, **pnpm** ≥ 9
2. **Docker Desktop** (or Docker Engine) running
3. **Docker Desktop** running
4. Ports free: `3000`, `3001`, `4000`, `5433`, `6379`, `7700`, `9000`

**Windows:** `pnpm ci` uses PowerShell automatically. **Linux/macOS:** uses bash.

```bash
pnpm ci
```

Expected result: exit code `0`, all tests green, no skipped E2E.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `hasan-shop-postgres is not healthy` | Docker not running or port 5433 in use | Start Docker; free port |
| `API health: database not up` | Migrations not applied | Check `pnpm db:migrate` logs |
| E2E timeout on admin login | Wrong seed password | Align `SEED_ADMIN_PASSWORD` / `ADMIN_PASSWORD` |
| MinIO probe fails | Container not started | `docker compose logs minio` |
| Playwright browser missing | Browsers not installed | `pnpm --filter @hasan-shop/e2e exec playwright install --with-deps chromium` |

View Playwright trace after failure:

```bash
cd e2e && npx playwright show-trace test-results/<folder>/trace.zip
```

---

## Files reference

| File | Role |
|------|------|
| `.github/workflows/ci.yml` | GitHub Actions workflow |
| `scripts/ci/run-ci.sh` | Local full pipeline |
| `scripts/ci/wait-for-url.sh` | HTTP health polling |
| `scripts/ci/verify-docker-health.sh` | Docker + HTTP infra checks |
| `scripts/ci/start-apps.sh` | Start API / Admin / Storefront |
| `scripts/ci/wait-for-apps.sh` | Application health gates |
| `scripts/ci/stop-ci.sh` | Teardown |
| `docker-compose.yml` | Infrastructure services |
| `e2e/playwright.config.ts` | E2E runner configuration |
