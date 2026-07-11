# HASAN SHOP — Task Tracker

**Last Updated**: 2026-07-10

---

## [M3.5] E2E & Operations Documentation — 2026-07-10

### Completed

- [x] Expand `storefront.spec.ts` — cart flow, checkout page load, track page
- [x] Create `admin-workflows.spec.ts` — login, dashboard, orders, analytics, inventory
- [x] Create `shipping-fulfillment.spec.ts` — admin fulfillment page smoke
- [x] Create `e2e/helpers/admin-auth.ts` — shared admin login helper
- [x] Create `TESTING.md` — coverage targets, run guides, CI requirements
- [x] Create `OPERATIONS.md` — Docker, migrations, seeds, env vars, deployment
- [x] Create `MONITORING.md` — health endpoints, logging, alerts
- [x] Create `BACKUP_RECOVERY.md` — Postgres, Redis, MinIO procedures
- [x] Create `scripts/generate-coverage-report.ps1`
- [x] ADR-016 webhook security, ADR-017 coverage strategy
- [x] Update `CHANGELOG.md`, `OPEN_TASKS.md`, `QUALITY_REPORT.md`, `DECISIONS.md`

### In Progress / Deferred

- [ ] Add Playwright E2E job to GitHub Actions CI
- [ ] Raise API coverage above 60% target
- [ ] E2E happy-path: checkout place order → track result
- [ ] E2E fulfillment stage progression with live order

---

## [M3] Operations & Fulfillment — 2026-07-10

### Completed

- [x] Fulfillment workflow — 4-stage warehouse pipeline (picking → packing → QC → ready_to_ship)
- [x] Fulfillment admin API — initialize, start, complete, skip stages
- [x] Barcode/QR data generation on stage complete (order number + JSON payload)
- [x] Shipping carrier abstraction (`@hasan-shop/carrier-adapters`)
- [x] Yalidine adapter — rates, parcel creation, tracking
- [x] Stub adapters — ZR Express, Ecotrack, Noest
- [x] Admin shipping API — quote, create shipment, track, cancel, list carriers
- [x] Carrier webhook endpoint — status sync to shipments and orders
- [x] Inventory service — reserve, release, adjust, low-stock alerts, movement audit
- [x] Atomic checkout with stock deduction and overselling prevention
- [x] Order automation — fulfillment init, auto-shipment, inventory release, notifications
- [x] Supplier CRUD API with lead-time and margin fields
- [x] Supplier auto-assignment rules (lowest lead time)
- [x] Customer CRM — notes, tags, phone/customer lookup
- [x] Analytics API — overview, top products/customers/categories, carriers, provinces, revenue
- [x] Schema migration `0003_m3_operations.sql`
- [x] M3 unit tests — fulfillment, shipping, automation, checkout repository
- [x] M3 documentation — FULFILLMENT, SHIPPING, SUPPLIERS, BUSINESS_RULES, security/performance reports

### In Progress / Deferred

- [ ] Admin UI for fulfillment, shipping, suppliers, analytics
- [ ] HTTP endpoints for supplier product assignment / auto-assign
- [ ] Yalidine webhook signature verification
- [ ] Audit logging for M3 admin mutations
- [ ] Upgrade `drizzle-orm` to `>=0.45.2` (security audit finding)

---

## [M2] Order Management & Checkout — 2026-07-10

### Completed

- [x] Shopping cart (persistent, guest + customer)
- [x] Buy Now flow
- [x] Guest checkout (Algeria-optimized form)
- [x] Shipping cost calculation + delivery estimate
- [x] Duplicate order prevention (idempotency + 5-min window)
- [x] Full order lifecycle with state machine
- [x] Status history with actor + timestamps
- [x] Public order tracking (order number + phone)
- [x] Admin order management (filters, bulk, assign, notes)
- [x] Invoice + packing slip print
- [x] CSV/Excel export
- [x] Favorites, recently viewed, related/recommended products
- [x] WhatsApp + email notifications with editable templates
- [x] Clean Architecture (repositories + application services)
- [x] ORDER_WORKFLOW.md
- [x] Integration tests scaffold (orders flow)
- [x] Storefront cart/checkout/track/favorites UI
- [x] Admin orders UI

---

## [M1.5] Production Hardening — 2026-07-09

### Completed

- [x] Repository interfaces and Drizzle implementations
- [x] CSRF protection with global guard
- [x] Audit logging service
- [x] Login brute-force mitigation (Redis + DB)
- [x] Password policy validator
- [x] File upload security validation + virus scan hook
- [x] CI smoke test job and `verify-stack.ps1`
- [x] Integration test scaffold (Supertest) and Playwright e2e scaffold
- [x] Security migration `0001_security_hardening.sql`
- [x] Helmet CSP in production, session rotation, admin catalog expansion

---

## [M1] Core API & Admin — 2026-07-09

### Completed

- [x] Auth, settings, geo, health, catalog foundation
- [x] Admin and storefront application shells
- [x] Role/permission model with seeded roles
- [x] DB schema and seed foundations

---

## [M0] Foundation — 2026-07-09

### Completed

- [x] Turborepo + pnpm monorepo
- [x] `apps/api`, `apps/admin`, `apps/storefront`, shared packages
- [x] Drizzle database package and baseline schema
- [x] Initial documentation (README, SRS, API, SECURITY, ROADMAP)
