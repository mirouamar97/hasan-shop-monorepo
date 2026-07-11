# HASAN SHOP — Open Tasks (Post M3.5)

**Last Updated**: 2026-07-10  
**Milestone 3**: Operations & Fulfillment — **Complete (API code)**  
**Milestone 3.5**: Reliability & Production Readiness — **Complete (code + tests)**  
**RC1 Stabilization Sprint**: **Complete (artifacts)** — **NOT approved for release** (see [RC1_FINAL_REPORT.md](./RC1_FINAL_REPORT.md))

---

## RC1 Stabilization Sprint (2026-07-10)

### Completed

- [x] Production Dockerfiles (`Dockerfile.api`, `.admin`, `.storefront`, `.migrate`)
- [x] `docker-compose.prod.yml` with nginx, ClamAV, backup sidecar, resource limits
- [x] `scripts/deploy/deploy.sh` + `validate-deployment.sh`
- [x] ClamAV malware scanner (LB-2 / BUG-018)
- [x] Webhook secret rotation + regression tests (LB-4 / BUG-029)
- [x] Guest cookie `secure: true` in production (LB-10)
- [x] Production env validation (`AUTH_SECRET`, `WEBHOOK_SECRET_DEFAULT`, `CLAMAV_HOST`)
- [x] `.env.example` + `.env.production.example` reconciliation (LB-5)
- [x] Automated PostgreSQL backup service (LB-6)
- [x] SEO minimum: `sitemap.ts`, `robots.ts`, favicon, JSON-LD, Twitter cards (LB-8)
- [x] Accessibility P0: skip link, cart labels, admin checkboxes, aria-live (LB-11)
- [x] Root `README.md` with deploy pointer (LB-9)
- [x] RC1 documentation set (7 new/updated docs)
- [x] `drizzle-orm` ≥ 0.45.2 / BUG-030 closed
- [x] Typecheck 11/11 packages pass
- [x] Unit tests: 220 API + 70 shared/carrier pass
- [x] `pnpm audit`: 0 high vulnerabilities

### Not completed / blocking RC1

- [ ] **LB-7** — `pnpm ci` green on clean machine with Docker
- [ ] **LB-3** — Resend + WhatsApp configured in staging
- [ ] API line coverage restored to ≥ 85% (currently **78.24%**)
- [ ] Production deploy verified on clean host
- [ ] Backup restore drill logged

---

## Completed in M3.5

- [x] API line coverage **85.01%** at M3.5 close (regressed to 78.24% after RC1 health/ClamAV code)
- [x] Shared + carrier-adapters coverage **100%** each
- [x] Webhook security: signature, timestamp, nonce, replay protection (`WebhookSecurityService`)
- [x] Zero dependency high vulnerabilities (`pnpm audit` clean)
- [x] `drizzle-orm` upgraded to ≥ 0.45.2
- [x] `SECURITY_AUDIT_REPORT.md` + `PERFORMANCE_BENCHMARK.md` regenerated
- [x] `TESTING.md`, `OPERATIONS.md`, `MONITORING.md`, `BACKUP_RECOVERY.md`
- [x] 14 Playwright E2E specs (require running Docker stack to execute)
- [x] Repository, service, controller, guard, interceptor test suites

---

## P0 — Before Production Launch

| ID | Task | Status |
|----|------|--------|
| P0-01 | Start Docker Desktop and run `pnpm db:migrate && pnpm db:seed` for M3 migration | Open |
| P0-02 | Bind production malware scanner for uploads | **Done (RC1)** |
| P0-03 | Configure Resend + WhatsApp webhook in production | Open (LB-3) |
| P0-04 | Configure Yalidine API credentials in `carrier_configs` | Open (ops) |
| P0-05 | ~~Upgrade `drizzle-orm` to `>=0.45.2`~~ | **Done (M3.5)** |
| P0-06 | Set `WEBHOOK_SECRET_DEFAULT` / per-carrier secrets in production | Open (ops) |
| P0-07 | Add Playwright E2E job to CI pipeline | **Done (RC1)** |
| P0-08 | Start Docker Desktop and run full integration + E2E verification | **Done (RC1 code)** — LB-7 CI run pending |

---

## P1 — Post M3.5 Follow-up

| ID | Task |
|----|------|
| P1-01 | Raise API coverage above 85% (currently **78.24%**) |
| P1-02 | Integration tests for M3 admin endpoints (fulfillment, shipping) |
| P1-03 | HTTP endpoints for supplier assign/auto-assign |
| P1-04 | Extend audit logging to M3 mutations |
| P1-05 | E2E: full checkout → track happy path with placed order |
| P1-06 | E2E: fulfillment stage progression with seeded order |
| P1-07 | Customer accounts + order history |
| P1-08 | Coupon application at checkout |

---

## P2 — Later

| ID | Task |
|----|------|
| P2-01 | SMS notifications |
| P2-02 | Online payment (CIB/Edahabia) |
| P2-03 | Background job queue for shipment creation |
| P2-04 | Redis cache for carrier registry and analytics |
| P2-05 | Multi-warehouse inventory |
| P2-06 | ~~MinIO health probe in `/api/v1/health`~~ **Done (RC1)** |
| P2-07 | Synthetic production E2E monitors |

---

## Completed in M3

- [x] Fulfillment workflow (4 stages) with admin API
- [x] Barcode/QR data on stage completion
- [x] Carrier adapter package (Yalidine + stubs)
- [x] Admin shipping API (quote, create, track, cancel)
- [x] Carrier webhook endpoint
- [x] Inventory movements, adjust, low-stock alerts
- [x] Atomic checkout stock deduction
- [x] Order automation (fulfillment, shipment, inventory release)
- [x] Supplier CRUD + auto-assignment rules
- [x] Customer CRM (notes, tags)
- [x] Analytics API endpoints
- [x] Migration `0003_m3_operations.sql`
- [x] M3 unit tests (fulfillment, shipping, automation, checkout)
- [x] M3 documentation set

---

## Completed in M2

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
