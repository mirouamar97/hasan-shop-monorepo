# Changelog

All notable changes to HASAN SHOP are documented here.

---

## [M3.5] - 2026-07-10 — E2E Expansion & Operational Documentation

### Added
- **E2E tests** — expanded `storefront.spec.ts` (cart flow, checkout page, track page)
- **E2E tests** — `admin-workflows.spec.ts` (login, dashboard, orders, analytics, inventory)
- **E2E tests** — `shipping-fulfillment.spec.ts` (fulfillment page smoke)
- **E2E helper** — `e2e/helpers/admin-auth.ts` for shared admin login
- **Coverage script** — `scripts/generate-coverage-report.ps1` (cross-package Vitest summary)
- **Documentation** — `TESTING.md` (coverage targets, run instructions, CI requirements)
- **Documentation** — `OPERATIONS.md` (Docker stack, migrations, seeds, env vars, deployment)
- **Documentation** — `MONITORING.md` (health endpoints, logging, alerts)
- **Documentation** — `BACKUP_RECOVERY.md` (Postgres, Redis, MinIO backup/restore)
- **ADRs** — ADR-016 (webhook security strategy), ADR-017 (coverage strategy)

### Changed
- `e2e/playwright.config.ts` — admin project matches `shipping-fulfillment.spec.ts`
- `QUALITY_REPORT.md`, `OPEN_TASKS.md`, `TASKS.md` — M3.5 milestone tracking

---

## [M3] - 2026-07-10 — Operations & Fulfillment

### Added
- **Fulfillment workflow** — 4-stage pipeline (picking, packing, quality_check, ready_to_ship) with admin API
- **Barcode/QR data** — order number barcode and JSON QR payload stored on stage completion
- **Carrier adapters package** (`@hasan-shop/carrier-adapters`) — registry pattern with Yalidine + stub carriers
- **Yalidine integration** — live rate quotes, parcel creation, tracking history
- **Stub carriers** — ZR Express, Ecotrack, Noest for development
- **Admin shipping API** — quote, create shipment, track, cancel, list carriers
- **Carrier webhooks** — `POST /api/v1/webhooks/carriers/:slug` for status sync
- **Inventory service** — stock reserve/release, adjust, movement audit trail, low-stock alerts
- **Atomic checkout** — transactional stock deduction with overselling prevention
- **Order automation** — fulfillment init on confirm, auto-shipment on ready_to_ship, inventory release on cancel
- **Supplier management** — CRUD API, lead-time/margin fields, auto-assignment by lowest lead time
- **Customer CRM** — notes, tags, phone/customer profile lookup
- **Analytics API** — overview, rankings, carrier/province performance, revenue by day
- **Schema migration** `0003_m3_operations.sql` — fulfillment tasks, inventory movements, CRM tables, indexes
- **M3 documentation** — FULFILLMENT.md, SHIPPING.md, SUPPLIERS.md, BUSINESS_RULES.md, security/performance reports
- **M3 unit tests** — fulfillment, shipping, automation, checkout repository

### Changed
- `AutomationService` wired into order status transitions
- `app.module.ts` registers Shipping, Fulfillment, Inventory, Suppliers, Analytics, CRM modules
- Supplier table extended: `lead_time_days`, `notes`, `default_margin_percent`
- New RBAC permissions: `shipping:*`, `suppliers:*`, `analytics:read`
- New role presets: `fulfillment_agent`, `analyst` permission sets updated

### Security
- Dependency audit: 1 high (`drizzle-orm`), 2 moderate (`esbuild`, `postcss`) — see `SECURITY_AUDIT_REPORT.md`
- Carrier webhook endpoint is unauthenticated (signature verification pending)

---

## [M2] - 2026-07-10 — Order Management & Checkout System

### Added
- **Cart API** — persistent guest/customer carts (`/api/v1/cart`)
- **Checkout API** — shipping quotes, place order, buy now with idempotency + duplicate prevention
- **Order lifecycle** — M2 status machine (pending → completed + exception states)
- **Order tracking** — public track by order number + phone
- **Admin orders** — list, detail, status transitions, bulk actions, assign operator, internal notes
- **Export** — CSV and Excel-compatible order export
- **Print** — invoice and packing slip HTML endpoints
- **Engagement** — favorites (Redis guests + DB customers), recently viewed, related/recommended products
- **Notifications** — email (Resend) + WhatsApp webhook with admin-editable templates
- **Storefront** — cart, checkout, success, track, favorites pages; product add-to-cart/buy-now
- **Admin UI** — orders list and detail pages
- **Schema migration** `0002_order_workflow_m2.sql`
- **ORDER_WORKFLOW.md** — complete business rules documentation

### Changed
- Renamed milestone from "Cart & Checkout" to **Order Management & Checkout System**
- Order status enum aligned to M2 lifecycle
- Orders table extended: `assigned_operator_id`, delivery estimates, `idempotency_key`

---

## [M1.5] - 2026-07-09

### Added
- Repository interfaces and Drizzle repository implementations for key domains.
- CSRF protection with global guard and `GET /api/v1/auth/csrf`.
- Audit logging service and audit repository wiring.
- Login brute-force mitigation (Redis lockout + DB lock columns).
- Password policy validator and test coverage for policy/security modules.
- File upload security validation (extension, MIME, magic bytes) and virus scanning hook interface.
- CI smoke test job and stack verification script (`scripts/verify-stack.ps1`).
- Integration test scaffold (Supertest) and Playwright e2e scaffold.
- Security migration `0001_security_hardening.sql`.

### Changed
- Helmet configuration now applies CSP in production.
- Session management rotates sessions on login.
- Seed workflow now supports `SEED_ADMIN_PASSWORD`.
- Admin catalog/product workflows expanded (edit/archive/restore/images/variants/stock/bulk operations).
- Docker Postgres mapped to host port `5433` to avoid local conflicts.
- NestJS controllers use explicit `@Inject()` for Vitest-compatible DI.
- Audit logging extended to product mutations and settings updates.
- Meilisearch Docker healthcheck switched from `wget` to `curl`.

### Fixed
- Multiple prior security gaps: missing CSRF, missing audit writes, missing session rotation, disabled CSP.
- Previous seed hardcoding issue replaced with env-based password input.
- AuthGuard module wiring in Settings and Catalog modules.
- Integration test failures from undefined controller services.
- `verify-stack.ps1` PowerShell stderr handling and Postgres port.

### Verified
- `scripts/verify-stack.ps1` — all checks pass.
- API tests — 15/15 pass with coverage report.
- Playwright E2E — 3/3 pass.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` — pass.

---

## [M1] - 2026-07-09

### Added
- Core API modules for auth, settings, geo, health, and catalog foundation.
- Admin and storefront application shells with initial routes and authentication flow entry points.
- Role/permission model and seeded administrative role set.
- DB schema and seed foundations for commerce entities and configuration.

### Changed
- CI quality gates matured across lint, typecheck, test, and build.
- Shared package boundaries and typing conventions stabilized.

---

## [M0] - 2026-07-09

### Added
- Monorepo foundation with Turborepo + pnpm workspaces.
- Core app/package structure (`apps/api`, `apps/admin`, `apps/storefront`, shared packages).
- Drizzle database package and baseline schema/migration setup.
- Initial project documentation set (README, SRS, API, SECURITY, ROADMAP, deployment docs).

### Changed
- Development workflow standardized around workspace scripts and CI.

### Notes
- M0 established foundation quality but did not by itself indicate production readiness.
