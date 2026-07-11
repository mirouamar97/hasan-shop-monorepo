# Test Strategy

Testing strategy for HASAN SHOP — a production dropshipping platform for Algeria. Every layer has a defined scope, tooling, and CI gate. **No tests are skipped in CI.**

---

## Pyramid overview

```
                    ┌─────────────┐
                    │  E2E (14)   │  Playwright — full browser, 3 apps
                   ┌┴─────────────┴┐
                   │ Integration (20)│  Vitest + Supertest + real Postgres
                  ┌┴─────────────────┴┐
                  │   Unit (218+)      │  Vitest — mocked I/O, fast
                 └─────────────────────┘
```

| Layer | Count | Speed | CI step |
|-------|-------|-------|---------|
| Unit | 218+ | < 30 s | `pnpm test:coverage` |
| Integration | 20 | < 60 s | `pnpm test:integration` |
| E2E | 14 | < 3 min | `pnpm test:e2e:ci` |

---

## Unit tests

**Purpose:** Verify business logic, validators, state machines, and service behavior in isolation.

**Tooling:** Vitest + `@nestjs/testing` (API), Vitest (packages).

**Location:**

- `apps/api/src/**/*.test.ts` (excluding `src/test/integration/`)
- `packages/shared/src/**/*.test.ts`
- `packages/carrier-adapters/src/**/*.test.ts`

**Patterns:**

- Mock repositories and external I/O (Redis, S3, email, carriers).
- Test order state machine transitions, webhook HMAC validation, password policy, pricing rules.
- Controller tests assert HTTP status codes and DTO mapping.

**Coverage gates:**

| Package | Line coverage target |
|---------|---------------------|
| `@hasan-shop/api` | ≥ 85% |
| `@hasan-shop/shared` | 100% |
| `@hasan-shop/carrier-adapters` | 100% |

**Run locally:**

```bash
pnpm --filter @hasan-shop/api test
pnpm test:coverage
```

---

## Integration tests

**Purpose:** Verify API endpoints against a real PostgreSQL database — migrations, constraints, transactions, and cross-module flows.

**Tooling:** Vitest + Supertest + live Postgres (Docker).

**Location:** `apps/api/src/test/integration/*.integration.test.ts`

**Suites:**

| File | Scope |
|------|-------|
| `api.integration.test.ts` | Health, catalog reads |
| `auth-cart-engagement.integration.test.ts` | Auth sessions, cart, favorites |
| `catalog.integration.test.ts` | Products, categories, brands |
| `orders.integration.test.ts` | Checkout → order lifecycle |
| `admin-operations.integration.test.ts` | Admin-only endpoints |
| `m3-operations.integration.test.ts` | Shipping, fulfillment, inventory, suppliers |

**CI behavior:**

- `CI=true` → tests **must run**; unreachable database is a hard failure.
- Local dev without Docker → suites are skipped via `describeIfDatabase` (developer convenience only).

**Run locally (Docker required):**

```bash
docker compose up -d postgres redis
pnpm db:migrate && pnpm db:seed
pnpm test:integration
```

---

## E2E tests

**Purpose:** Validate user-facing flows across API, Admin, and Storefront in a real browser.

**Tooling:** Playwright (Chromium).

**Location:** `e2e/tests/*.spec.ts`

### Architecture

| Pattern | Path | Role |
|---------|------|------|
| **Page Objects** | `e2e/pages/*.page.ts` | Encapsulate selectors and page actions |
| **Fixtures** | `e2e/fixtures/test-fixtures.ts` | Extended `test` with page objects + `authenticatedAdminPage` |
| **Helpers** | `e2e/helpers/config.ts`, `wait-for-health.ts` | Shared config and stack polling |
| **Global setup** | `e2e/global-setup.ts` | CI health gate before specs run |

### Specs

| Spec | Project | Tests |
|------|---------|-------|
| `admin-login.spec.ts` | admin | Login page render |
| `admin-workflows.spec.ts` | admin | Dashboard, orders, analytics, inventory |
| `shipping-fulfillment.spec.ts` | admin | Fulfillment workflow UI |
| `storefront.spec.ts` | storefront | Homepage, cart, checkout, track (Arabic) |

### Playwright configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| `fullyParallel` | `true` | Faster CI |
| `workers` | `2` (CI) | Balance speed vs. resource use |
| `retries` | `2` (CI) | Flake tolerance on network/UI timing |
| `screenshot` | `only-on-failure` | Debug failed steps |
| `video` | `retain-on-failure` | Replay user actions |
| `trace` | `retain-on-failure` | Playwright Trace Viewer |

**View trace:**

```bash
cd e2e
npx playwright show-trace test-results/<test-folder>/trace.zip
```

### CI prerequisites

E2E requires the full stack (see [CI_PIPELINE.md](./CI_PIPELINE.md)):

1. Docker: Postgres, Redis, Meilisearch, MinIO
2. Migrated + seeded database
3. API (:4000), Admin (:3001), Storefront (:3000) running

**No skip logic.** If the stack is down, tests fail immediately.

**Run locally:**

```bash
# Option A — Playwright starts dev servers automatically
pnpm test:e2e

# Option B — Full CI stack
pnpm ci
```

---

## Performance tests

**Purpose:** Establish baseline latency and throughput for critical paths before releases.

**Current state:** Documented benchmarks in `PERFORMANCE_BENCHMARK.md` (manual / scripted probes).

**Recommended approach (future):**

| Tool | Target |
|------|--------|
| `k6` or `autocannon` | API endpoints: `/api/v1/health`, catalog list, checkout |
| Lighthouse CI | Storefront Core Web Vitals |
| PostgreSQL `EXPLAIN ANALYZE` | Slow query review |

**Thresholds (targets):**

- API p95 < 200 ms for read endpoints
- Checkout p95 < 500 ms
- Storefront LCP < 2.5 s

Not yet automated in CI — planned as a separate non-blocking workflow.

---

## Security tests

**Purpose:** Prevent regressions in auth, input validation, and dependency vulnerabilities.

**Current coverage:**

| Check | Tool | CI |
|-------|------|-----|
| Dependency audit | `pnpm audit` | Manual / pre-release |
| Webhook HMAC + replay | Unit tests (`WebhookSecurityService`) | `test:coverage` |
| Password policy | Unit tests | `test:coverage` |
| HTTP security headers | Helmet (API), Next.js headers (frontends) | E2E smoke |
| CSRF / session | Integration tests | `test:integration` |

**Recommended additions:**

- OWASP ZAP baseline scan against staging
- `npm audit` gate in CI (currently 0 high vulnerabilities)
- Secret scanning (GitHub Advanced Security)

Documented in `SECURITY_AUDIT_REPORT.md`.

---

## Load tests

**Purpose:** Validate behavior under concurrent users — cart, checkout, order processing.

**Current state:** Not automated. Architecture supports horizontal scaling (stateless API, Redis sessions, Postgres).

**Recommended approach:**

```text
k6 scenario:
  - 50 VUs browse catalog (5 min)
  - 20 VUs add to cart
  - 10 VUs complete checkout
  - Assert: error rate < 1%, p95 < 1 s
```

Run against a staging environment with production-like data volume. **Not part of PR CI** (too slow/costly) — schedule nightly or pre-release.

---

## CI execution summary

| Step | Command | Skips allowed? |
|------|---------|----------------|
| Unit + coverage | `pnpm test:coverage` | No |
| Integration | `pnpm test:integration` | **No** (CI) |
| E2E | `pnpm test:e2e:ci` | **No** |

Full pipeline: `pnpm ci` or GitHub Actions `CI` workflow.

---

## Adding new tests

### Unit

1. Co-locate `*.test.ts` next to the module under test.
2. Mock external dependencies via Vitest `vi.fn()`.
3. Run `pnpm --filter @hasan-shop/api test` — coverage must stay ≥ 85%.

### Integration

1. Add `*.integration.test.ts` under `apps/api/src/test/integration/`.
2. Wrap in `describeIfDatabase('...', () => { ... })`.
3. Use Supertest against `INestApplication` with real DB.

### E2E

1. Add a page object in `e2e/pages/` for new UI surfaces.
2. Register it in `e2e/fixtures/test-fixtures.ts`.
3. Write spec in `e2e/tests/` using fixtures — no raw selectors in specs.
4. Assign to `admin` or `storefront` project in `playwright.config.ts`.

---

## Related documentation

- [CI_PIPELINE.md](./CI_PIPELINE.md) — step-by-step CI execution
- [TESTING.md](./TESTING.md) — developer testing guide
- [QUALITY_REPORT.md](./QUALITY_REPORT.md) — milestone quality metrics
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) — security findings
