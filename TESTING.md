# HASAN SHOP — Testing Guide (M3.5)

**Last Updated**: 2026-07-10  
**Milestone**: M3.5 — E2E expansion, coverage reporting, operational docs

---

## Coverage Targets

| Layer | Target | Current (M3.5) | Gate |
|-------|--------|----------------|------|
| API unit + integration | **≥ 60%** statements | ~45–50% (varies by DB availability) | CI `test` job |
| Shared package | **≥ 70%** statements | Measured via `test:ci` | CI `test` job |
| Carrier adapters | **≥ 80%** statements | Unit tests on registry + Yalidine | CI `test` job |
| E2E (Playwright) | **100% smoke pass** | 14 tests across storefront + admin | Manual / release gate |
| Integration (DB) | All non-skipped pass | Requires Postgres + Redis | CI services |

### Coverage Philosophy (M3.5)

- **Unit tests** cover business rules (fulfillment stages, shipping quotes, automation hooks, checkout atomicity).
- **Integration tests** cover HTTP boundaries against a live Postgres instance (auth, orders, geo, products).
- **E2E tests** cover critical user journeys at smoke depth — page load, navigation, and one happy-path interaction per flow.
- Coverage is a **release signal**, not a vanity metric: prioritize controllers and repositories on the critical path (checkout, orders, fulfillment, webhooks).

---

## Prerequisites

- Node.js 20+ and pnpm 9+
- Docker Desktop (local integration + E2E with full stack)
- Playwright browsers: `pnpm --filter @hasan-shop/e2e install-browsers`

### Local Database

```powershell
docker compose up -d
pnpm db:migrate
pnpm db:seed
```

Use `DATABASE_URL` with port **5433** locally (see `DECISIONS.md` ADR-010).

---

## Unit Tests

Run all workspace unit tests:

```powershell
pnpm test
```

Run API tests with coverage:

```powershell
pnpm --filter @hasan-shop/api test:ci
```

Run carrier adapter tests:

```powershell
pnpm --filter @hasan-shop/carrier-adapters test
```

Run shared package tests:

```powershell
pnpm --filter @hasan-shop/shared test:ci
```

Coverage reports are written to:

- `apps/api/coverage/` (HTML + `coverage-summary.json`)
- `packages/shared/coverage/` (when tests exist)

---

## Integration Tests

Integration tests live in `apps/api/src/test/` and use Supertest against a bootstrapped NestJS app with a real Postgres connection.

```powershell
# Ensure Postgres (5433) and Redis are running
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm --filter @hasan-shop/api test:ci
```

Tests that require DB are skipped automatically when `DATABASE_URL` is unreachable.

---

## E2E Tests (Playwright)

E2E package: `e2e/`

| Spec | Project | Coverage |
|------|---------|----------|
| `storefront.spec.ts` | storefront | Home, products, cart flow, checkout form, track page |
| `admin-login.spec.ts` | admin | Login page render |
| `admin-workflows.spec.ts` | admin | Login → dashboard, orders, analytics, inventory |
| `shipping-fulfillment.spec.ts` | admin | Fulfillment page smoke |

### Run locally

Playwright starts API, admin, and storefront dev servers automatically (unless `CI=true`):

```powershell
pnpm test:e2e
```

With explicit URLs (when servers are already running):

```powershell
$env:ADMIN_URL = "http://localhost:3001"
$env:STOREFRONT_URL = "http://localhost:3000"
pnpm test:e2e
```

### Admin credentials (seed)

| Field | Value |
|-------|-------|
| Email | `admin@hasan-shop.dz` |
| Password | `SEED_ADMIN_PASSWORD` env var (default in `.env.example`) |

Override in E2E via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

### View report

```powershell
pnpm --filter @hasan-shop/e2e exec playwright show-report
```

---

## Coverage Report Script

Generate a cross-package coverage summary:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-coverage-report.ps1
```

Outputs pass/fail per package and aggregate statement coverage from Vitest `coverage-summary.json` files.

---

## CI Requirements

The GitHub Actions `CI` workflow (`.github/workflows/ci.yml`) enforces:

| Job | Requirements |
|-----|--------------|
| `lint-and-typecheck` | `pnpm lint`, `pnpm typecheck` |
| `test` | Postgres + Redis services, migrate, seed, `pnpm test:ci` |
| `smoke` | API boot, `/api/v1/health`, `/api/v1/settings/public` |
| `build` | `pnpm build` after test + smoke pass |

### CI environment

- Postgres on port **5432** (GitHub Actions service container)
- `DATABASE_URL=postgresql://hasan_shop:hasan_shop_dev@localhost:5432/hasan_shop`
- `SEED_ADMIN_PASSWORD` set for reproducible seed

### Recommended CI additions (M3.5+)

- [ ] Add Playwright E2E job with migrated DB + built apps
- [ ] Upload combined coverage artifact from `generate-coverage-report.ps1`
- [ ] Fail build when API statement coverage drops below 60%

---

## Test Data

Seed script (`packages/database/src/seed.ts`) provides:

- Super admin user
- Sample products (`montre-intelligente`, etc.)
- Wilayas/communes (geo)
- Carrier configs and default supplier

E2E cart flow depends on seeded product `montre-intelligente`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Integration tests skipped/failed | Start Docker, run `pnpm db:migrate && pnpm db:seed` |
| E2E login fails | Confirm `SEED_ADMIN_PASSWORD` matches `.env` |
| Cart flow empty | Re-run seed; verify API on `:4000` |
| Playwright timeout | Increase `timeout` in `e2e/playwright.config.ts` or start servers manually |
| Port 5432 conflict locally | Use Docker mapping on **5433** per `.env.example` |
