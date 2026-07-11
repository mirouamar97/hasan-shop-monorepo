# Product Roadmap

**Project**: HASAN SHOP  
**Planning Horizon**: July 2026 – Q2 2027  
**Methodology**: Milestone-based delivery (M0–M7)

---

## Roadmap Overview

```
M0 ─── M1 ─── M2 ─── M3 ─── M4 ─── M5 ─── M6 ─── M7 ─── Future
Foundation  Catalog  Storefront  Orders  Shipping  Deploy  Harden  Launch  Scale
```

| Milestone | Target | Theme |
|-----------|--------|-------|
| M0 | Week 1–2 | Foundation & monorepo scaffold |
| M1 | Week 3–4 | Database, auth, geo API |
| M2 | Week 5–7 | Catalog management |
| M3 | Week 8–10 | Storefront & checkout |
| M4 | Week 11–13 | Orders, confirmation, Yalidine |
| M5 | Week 14–15 | Production deployment |
| M6 | Week 16–17 | Security hardening & QA |
| M7 | Week 18 | Launch & stabilization |

---

## M0: Foundation (Complete)

**Goal**: Monorepo scaffold, infrastructure, CI pipeline.

### Deliverables

- [x] Turborepo monorepo with pnpm workspaces
- [x] `apps/storefront`, `apps/admin`, `apps/api` scaffolded
- [x] `packages/database` with Drizzle schema (full entity model)
- [x] `packages/shared` — types, permissions, validation
- [x] `packages/carrier-adapters` — Yalidine stub
- [x] `packages/logger` — structured Pino logging
- [x] `docker-compose.yml` — Postgres, Redis, Meilisearch, MinIO
- [x] `.github/workflows/ci.yml` — lint, typecheck, test, build
- [x] `.env.example` with all configuration keys
- [x] Documentation package (this repo)

### Exit Criteria

- `pnpm install && pnpm dev` starts all three apps
- CI passes on `main`
- Database migrates and seeds successfully

---

## M1: Core Platform

**Goal**: Authentication, geography, settings API, admin login.

### Deliverables

- [x] NestJS API bootstrap with versioning, CORS, helmet, validation
- [x] Admin auth: login, logout, me endpoints
- [x] Session management in PostgreSQL + Redis cache
- [x] RBAC roles and permissions seeded
- [x] Geo API: wilayas and communes with AR/FR names
- [x] Settings API: public and admin endpoints
- [x] Health check endpoint
- [x] Admin login page and dashboard shell
- [x] Algeria geo data seed (58 wilayas, all communes)

### Exit Criteria

- Admin can log in and see dashboard shell
- Storefront can fetch wilayas for dropdown
- All M1 API endpoints documented in API.md

---

## M2: Catalog Management

**Goal**: Full product lifecycle in admin; search index.

**Target**: Week 5–7

### Deliverables

- [ ] Product CRUD API with translations and variants
- [ ] Category tree CRUD with AR/FR translations
- [ ] Brand CRUD
- [ ] Supplier management
- [ ] Image upload to S3/MinIO with CDN URLs
- [ ] Inventory tracking and low-stock alerts
- [ ] Meilisearch indexing on product create/update/delete
- [ ] Admin catalog UI: product list, create/edit forms
- [ ] CSV import (`catalog:import`)
- [ ] Public catalog API: list, detail, filter by category/brand
- [ ] Search API with facets

### Exit Criteria

- Catalog manager can publish a product visible via API
- Search returns results in Arabic and French
- 50+ sample products seeded for testing

---

## M3: Storefront & Checkout

**Goal**: Customer-facing shop with COD checkout.

**Target**: Week 8–10

### Deliverables

- [ ] Storefront homepage, category pages, product detail
- [ ] AR/FR locale routing with RTL/LTR layouts
- [ ] Cart (guest session + customer persistence)
- [ ] Coupon application
- [ ] Checkout form with wilaya/commune cascading selects
- [ ] Shipping quote API integration
- [ ] COD order placement
- [ ] Order confirmation page
- [ ] Guest order tracking (order number + phone)
- [ ] Customer registration (optional) with phone OTP (SMS provider TBD)
- [ ] SEO: meta tags, sitemap.xml, robots.txt
- [ ] Mobile-responsive UI per UI_UX.md

### Exit Criteria

- End-to-end: browse → cart → checkout → order created in database
- Checkout works on mobile Chrome and Safari
- Lighthouse performance score ≥ 80 on mobile

---

## M4: Order Operations & Shipping

**Goal**: Internal order pipeline and Yalidine integration.

**Target**: Week 11–13

### Deliverables

- [ ] Admin order list with filters and search
- [ ] Order detail page with status history
- [ ] Confirmation workflow UI and API
- [ ] Order status state machine with valid transitions
- [ ] Yalidine adapter: create parcel, get rates, list stop desks
- [ ] Shipment creation from admin
- [ ] Label printing (PDF download)
- [ ] Yalidine webhook handler for tracking updates
- [ ] Shipment event timeline in admin and customer tracking
- [ ] COD reconciliation basic UI
- [ ] Email notifications: order placed, shipped (Resend)
- [ ] Dashboard widgets: orders today, pending confirmations

### Exit Criteria

- Agent confirms order, creates Yalidine shipment, tracking visible to customer
- Confirmation rate measurable in analytics
- Webhook updates order/shipment status within 5 minutes

---

## M5: Production Deployment

**Goal**: Live staging and production environments.

**Target**: Week 14–15

### Deliverables

- [ ] Production Dockerfiles for all apps
- [ ] GitHub Actions deploy workflow
- [ ] Staging environment on staging.hasan-shop.dz
- [ ] Production environment on hasan-shop.dz
- [ ] DNS, TLS, CDN (Cloudflare)
- [ ] Managed PostgreSQL and Redis
- [ ] Cloudflare R2 for object storage
- [ ] Automated daily backups with tested restore
- [ ] Monitoring: health checks, error alerting
- [ ] Environment secrets in vault (not .env files on servers)

### Exit Criteria

- Staging deploys automatically on `develop` merge
- Production deploys on `main` with smoke tests
- Backup restore verified

---

## M6: Security Hardening & QA

**Goal**: Production security gate and quality assurance.

**Target**: Week 16–17

### Deliverables

- [ ] Rate limiting on auth and checkout endpoints
- [ ] CSRF protection on admin mutations
- [ ] CSP headers on storefront and admin
- [ ] 2FA enforced for super_admin in production
- [ ] Account lockout after failed login attempts
- [ ] Carrier credential encryption at rest
- [ ] OWASP ZAP scan — no high/critical findings
- [ ] Load test: 100 concurrent users
- [ ] Accessibility audit (WCAG 2.1 AA storefront)
- [ ] Full regression test suite
- [ ] UAT with store owner and fulfillment team

### Exit Criteria

- SECURITY.md pre-production checklist 100% complete
- No P0/P1 bugs open
- UAT sign-off from stakeholders

---

## M7: Launch & Stabilization

**Goal**: Public launch and first 30 days of operations.

**Target**: Week 18 + 30 days post-launch

### Deliverables

- [ ] Production launch on hasan-shop.dz
- [ ] Initial product catalog live (minimum 30 SKUs)
- [ ] Yalidine production account active
- [ ] Support WhatsApp number published
- [ ] Google Analytics / Plausible analytics
- [ ] Google Search Console + sitemap submitted
- [ ] Social media announcement assets
- [ ] Runbook for common operations (refunds, refusals, re-ships)
- [ ] On-call rotation for first 2 weeks
- [ ] Daily metrics review: orders, confirmation rate, errors

### Launch KPIs (30 days)

| Metric | Target |
|--------|--------|
| Orders placed | ≥ 200 |
| Confirmation rate | ≥ 70% |
| Delivery success | ≥ 80% |
| Uptime | ≥ 99.5% |
| Mobile traffic | ≥ 75% of sessions |

### Exit Criteria

- 30 days stable operations
- Post-launch retrospective completed
- Backlog prioritized for Phase 2

---

## Future Phases (Post-M7)

### Phase 2: Growth (Q4 2026)

| Feature | Priority | Description |
|---------|----------|-------------|
| Online payments | High | CIB, Edahabia, BaridiMob via payment gateway |
| WhatsApp notifications | High | Order status via WhatsApp Business API |
| Advanced analytics | Medium | Cohort analysis, wilaya heatmaps, margin reports |
| Wishlist & reviews | Medium | Customer engagement features |
| Abandoned cart recovery | Medium | Email/SMS reminders |
| Additional carriers | Medium | ZR Express, Ecotrack, Noest adapters |
| International suppliers | Low | Feature-flagged cross-border sourcing |

### Phase 3: Scale (Q1 2027)

| Feature | Priority | Description |
|---------|----------|-------------|
| PWA / mobile app | High | Installable storefront or React Native app |
| Loyalty program | Medium | Points, referral codes |
| Advanced promotions | Medium | BOGO, bundle deals, flash sales |
| Multi-warehouse | Low | Inventory by location |
| AI product descriptions | Low | AR/FR SEO content generation |
| Live chat support | Medium | Integrated chat widget |

### Phase 4: Platform (Q2 2027+)

| Feature | Priority | Description |
|---------|----------|-------------|
| Multi-merchant marketplace | Low | Only if business pivots |
| Seller portal | Low | Vendor self-service |
| API for partners | Low | Public API for integrations |
| Franchise / white-label | Low | License platform to other merchants |

**Note**: HASAN SHOP remains single-merchant unless business strategy changes. Marketplace features are exploratory only.

---

## Risk Register

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Yalidine API downtime | High | Queue shipments; manual fallback | Fulfillment |
| Low confirmation rate | High | Optimize call scripts; WhatsApp first | Support |
| SMS provider delay | Medium | Launch with email; add SMS in Phase 2 | Engineering |
| High refusal rate | High | Better product descriptions; confirmation | Operations |
| Security breach | Critical | SECURITY.md controls; monitoring | Engineering |
| Slow mobile performance | Medium | Image optimization; CDN; caching | Engineering |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07 | COD-first, online payments feature-flagged | Market reality in Algeria |
| 2026-07 | Yalidine as default carrier | Widest coverage and API maturity |
| 2026-07 | Arabic default locale | Largest addressable audience |
| 2026-07 | Single-merchant architecture | Business model is own-brand dropshipping |
| 2026-07 | Drizzle ORM over Prisma | Lighter weight, SQL-first, better monorepo fit |
| 2026-07 | Session cookies over JWT for admin | Simpler revocation, httpOnly security |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | July 2026 | Initial roadmap M0–M7 |

---

## Related Documents

- [PROJECT.md](./PROJECT.md) — Vision and business model
- [SRS.md](./SRS.md) — Requirements traceability
- [DEPLOYMENT.md](./DEPLOYMENT.md) — M5 deployment details
