# HASAN SHOP — Architecture Decision Records (ADRs)

This file captures key technical decisions up to M1.5.

---

## ADR-001 — Repository Pattern over Direct ORM Access

- **Status**: Accepted (M1.5)
- **Decision**: Introduce domain repository interfaces and implement them in infrastructure with Drizzle.
- **Why**:
  - Reduce coupling between application services and SQL details.
  - Enable easier testing/mocking and future persistence changes.
  - Improve alignment with clean architecture goals.
- **Tradeoff**: Slight increase in boilerplate and interface maintenance.

---

## ADR-002 — CSRF Protection via Double-Submit Cookie

- **Status**: Accepted (M1.5)
- **Decision**: Use double-submit cookie strategy with:
  - server-issued CSRF cookie (`hasan_csrf`)
  - required matching `X-CSRF-Token` header on state-changing requests
  - global CSRF guard with explicit skip for safe/auth bootstrap endpoints
- **Why**:
  - Works with cookie-based auth sessions.
  - Simple to enforce at framework guard level.
- **Tradeoff**: Frontend must fetch/store token and attach header on mutations.

---

## ADR-003 — CSP via Helmet in Production Only

- **Status**: Accepted (M1.5)
- **Decision**: Enable CSP only in production profile through `buildCsp`, keep local dev flexible.
- **Why**:
  - Adds baseline XSS mitigation for deployed runtime.
  - Avoids unnecessary developer friction in local workflows.
- **Tradeoff**: Policy tuning and monitoring still required as frontend/assets evolve.

---

## ADR-004 — Session Rotation on Login

- **Status**: Accepted (M1.5)
- **Decision**: On successful login, create a fresh session and invalidate older sessions for that user.
- **Why**:
  - Reduces session fixation and stale-session exposure.
  - Improves account session hygiene.
- **Tradeoff**: Multi-device concurrency is limited unless explicitly reintroduced later.

---

## ADR-005 — Redis + DB Hybrid Login Lockout

- **Status**: Accepted (M1.5)
- **Decision**:
  - Use Redis for fast attempt counters and temporary lock keys.
  - Persist lock/attempt metadata on user records in DB (`failed_login_attempts`, `locked_until`).
- **Why**:
  - Fast throttling checks with Redis.
  - Durable lockout state in database for auditability and consistency.
- **Tradeoff**: More moving parts and failure modes across Redis/DB.

---

## ADR-006 — Search Access via Service and Fetch-Based Client Calls

- **Status**: Accepted (M1.5)
- **Decision**:
  - Backend owns Meilisearch indexing through an application service boundary.
  - Admin frontend interacts with backend via fetch-based API client utilities.
- **Why**:
  - Avoid direct frontend coupling to search engine internals.
  - Keep search index lifecycle under backend authorization and validation.
- **Tradeoff**: Additional backend endpoints and synchronization responsibility.

---

## ADR-007 — Upload Validation + Pluggable Virus Scan Hook

- **Status**: Accepted (M1.5)
- **Decision**: Enforce extension, MIME, and magic-byte checks with a scanner interface that defaults to no-op and can be replaced in production.
- **Why**:
  - Introduces immediate baseline file validation.
  - Keeps production malware scanning provider choice flexible.
- **Tradeoff**: Security effectiveness depends on production scanner binding.

---

## ADR-008 — CI Smoke Job as Release Gate Signal

- **Status**: Accepted (M1.5)
- **Decision**: Add dedicated smoke job that migrates/seeds and checks basic API health/settings responses.
- **Why**:
  - Catch critical boot/runtime regressions early in CI.
  - Provide faster release confidence than full e2e suites alone.
- **Tradeoff**: Smoke tests are broad but shallow; cannot replace deep integration/e2e coverage.

---

## ADR-009 — Explicit `@Inject()` for NestJS Constructor DI

- **Status**: Accepted (M1.5)
- **Decision**: Use `@Inject(ClassName)` on all controller and guard constructor parameters instead of relying solely on `emitDecoratorMetadata` reflection.
- **Why**:
  - Vitest/esbuild does not emit decorator metadata, causing `undefined` service injections in integration tests.
  - Explicit injection is reliable across test and production runtimes.
- **Tradeoff**: More verbose constructors; must remember `@Inject()` for new controllers.

---

## ADR-010 — Docker Postgres on Host Port 5433

- **Status**: Accepted (M1.5)
- **Decision**: Map Docker Postgres to `5433:5432` when local PostgreSQL occupies `:5432`.
- **Why**: Prevent authentication failures during local development on Windows machines with existing Postgres installs.
- **Tradeoff**: Developers must use `DATABASE_URL` with port `5433` in `.env`.

---

## ADR-011 — Carrier Adapter Registry Pattern (M3)

- **Status**: Accepted (M3)
- **Decision**: Extract carrier integrations into `@hasan-shop/carrier-adapters` with a `CarrierAdapterRegistry` loaded from DB `carrier_configs` at module init.
- **Why**:
  - Decouple shipping business logic from carrier-specific API details.
  - Enable stub adapters for development and incremental carrier rollout.
  - Single interface (`CarrierAdapter`) for quote, create, track, cancel, webhook verify.
- **Tradeoff**: Registry refresh requires app restart or explicit `refresh()` call when configs change.

---

## ADR-012 — Fulfillment as Stage-Based Task Pipeline (M3)

- **Status**: Accepted (M3)
- **Decision**: Model warehouse workflow as four fixed stages per order (`picking` → `packing` → `quality_check` → `ready_to_ship`), each with independent task status.
- **Why**:
  - Supports partial completion, skip, and operator assignment.
  - Barcode/QR data attached per completed stage for scanner integration.
  - Clear gate before order transitions to `ready_to_ship`.
- **Tradeoff**: Fixed stage list; custom workflows require schema/code change.

---

## ADR-013 — Atomic Checkout with Immediate Stock Deduction (M3)

- **Status**: Accepted (M3)
- **Decision**: Deduct `inventory.quantity` inside a single DB transaction at checkout rather than reserving then deducting later.
- **Why**:
  - Prevents overselling under concurrent checkouts.
  - Simpler inventory state — available = quantity minus reserved (reserved used for cancellation release path).
  - Movement audit trail in same transaction.
- **Tradeoff**: Longer transaction hold under high concurrency; may need `SELECT FOR UPDATE` at scale.

---

## ADR-014 — Order Automation via Status Change Hooks (M3)

- **Status**: Accepted (M3)
- **Decision**: Centralize post-status side effects in `AutomationService.onOrderStatusChange` (fulfillment init, auto-shipment, inventory release, notifications, low-stock check).
- **Why**:
  - Single place for business rules triggered by status transitions.
  - Auto-shipment failures are non-blocking (logged, not thrown).
- **Tradeoff**: Synchronous side effects in request path; shipment creation latency affects status update response time.

---

## ADR-015 — Dual Shipping Quote Paths (M3)

- **Status**: Accepted (M3)
- **Decision**: Checkout uses `DrizzleShippingRepository` flat rates; admin shipping uses `ShippingService` with live carrier adapters.
- **Why**:
  - Checkout must work without carrier API credentials configured.
  - Admin needs accurate carrier rates for operational decisions.
- **Tradeoff**: Checkout and admin quotes may return different prices until unified.

---

## ADR-016 — Carrier Webhook Security Layer (M3.5)

- **Status**: Accepted (M3.5)
- **Decision**: Enforce webhook authenticity through `WebhookSecurityService` with:
  - Per-carrier HMAC-SHA256 secrets (`WEBHOOK_SECRET_<CARRIER>` or `WEBHOOK_SECRET_DEFAULT`)
  - Required timestamp (±5 min clock skew) and nonce (Redis `SET NX` replay window, 10 min TTL)
  - Optional carrier-specific verifier delegated to adapter (`adapterVerifier`)
  - Production hard-fail when secret is missing; development permissive skip with warning log
- **Why**:
  - Prevents spoofed shipment status updates and order state corruption.
  - Replay protection via Redis nonces is cheap and effective at current scale.
  - Adapter-specific verification allows Yalidine signature formats without forking core logic.
- **Tradeoff**: Requires Redis availability for nonce store; clock sync required on webhook senders.

---

## ADR-017 — Tiered Test Coverage Strategy (M3.5)

- **Status**: Accepted (M3.5)
- **Decision**: Adopt milestone-based coverage targets enforced as release signals:
  - **API**: ≥ 60% statements (Vitest v8, `test:ci`)
  - **Shared**: ≥ 70% statements
  - **Carrier adapters**: ≥ 80% statements
  - **E2E**: 100% smoke pass (14 Playwright tests in M3.5)
  - Aggregate reporting via `scripts/generate-coverage-report.ps1`
- **Why**:
  - Uniform 80%+ across monorepo is unrealistic early on; tiered targets focus effort on risk.
  - E2E smoke catches integration failures unit tests miss (UI routing, auth cookies, locale).
  - Scriptable summary supports CI artifact upload and pre-release gates.
- **Tradeoff**: Coverage percentage can mask untested branches; E2E smoke depth is intentionally shallow until M4.
