# HASAN SHOP — Release Plan

**Document owner:** Engineering / CTO  
**Last updated:** 2026-07-10  
**Workflow model:** Professional release cycle (semver + release candidates)  
**Immediate target:** **Release Candidate 1 (RC1)** → **v1.0.0 Production Launch**

---

## Release philosophy

HASAN SHOP is transitioning from milestone-driven delivery to a **commercial software release cycle**. Each version is a product increment with defined scope, quality gates, and go-live criteria—not a development checkpoint.

| Principle | Rule |
|-----------|------|
| Semver | `MAJOR.MINOR.PATCH` — breaking changes only on major |
| Release candidates | `v1.0.0-rc.1`, `v1.0.0-rc.2` … until all launch blockers cleared |
| Quality gate | No version tag without green CI on a clean machine |
| Documentation | Every release ships with updated changelog, ops runbooks, and scorecard |
| Rollback | Every production deploy must have a tested rollback path |

---

## Version roadmap

### v1.0.0 — Production Launch

**Theme:** Algeria COD dropshipping platform — live commerce for real customers.

**Scope (must ship):**

- Storefront: browse, cart, guest checkout, order tracking (ar/fr)
- Admin: catalog, orders, fulfillment, shipping, inventory, analytics, CRM
- API: full REST surface, webhooks, notifications, search
- Infrastructure: Postgres, Redis, Meilisearch, MinIO
- Security: CSRF, RBAC, session auth, webhook HMAC, upload validation
- Operations: CI pipeline, backup runbook, monitoring hooks

**Out of scope for v1.0.0:**

- Customer accounts / order history
- Online payments (CIB/Edahabia)
- SMS notifications
- Mobile apps
- Marketplace / multi-vendor

**Success criteria:**

- RC1 complete (see below)
- 30-day staging soak with zero P0 incidents
- Production secrets configured (auth, webhooks, carriers, email)
- Restore drill executed successfully

---

### v1.1.0 — UX Improvements

**Theme:** Polish the customer and operator experience.

**Planned scope:**

- Unified storefront navigation (`StoreHeader` everywhere)
- Locale switcher (ar ↔ fr)
- Product variant selector and image gallery
- Checkout progress indicator and inline validation
- Search UI with pagination
- Admin i18n (French operator UI)
- Accessibility remediation (WCAG 2.1 AA target for critical flows)
- Featured products on homepage
- Breadcrumbs on PDP and category pages

**Quality targets:** Accessibility ≥ 85, UX ≥ 88, Core Web Vitals "Good" on mobile

---

### v1.2.0 — Marketing & Automation

**Theme:** Growth, retention, and operational automation.

**Planned scope:**

- Customer accounts and order history
- Coupon / promo codes at checkout
- Email marketing integrations (abandoned cart, post-purchase)
- WhatsApp notification templates (production-ready)
- SEO: sitemap, robots, JSON-LD, admin SEO settings wired to storefront
- Analytics dashboards expansion (conversion funnel, cohorts)
- Background job queue (shipment creation, notification retries)
- Synthetic E2E monitors in production

**Quality targets:** SEO ≥ 90, automated marketing flows tested end-to-end

---

### v2.0.0 — Mobile Applications

**Theme:** Native mobile presence for Algeria market.

**Planned scope:**

- React Native or Flutter customer app (iOS + Android)
- Push notifications for order status
- Deep links to track page
- Mobile-optimized checkout (phone-first UX)
- Admin mobile companion (order status updates, fulfillment scanning)
- Public API versioning strategy (`v2` if breaking changes required)
- Offline cart persistence

**Breaking change policy:** v2.0 may introduce API changes with deprecation period for v1 clients.

---

### v3.0.0 — Marketplace

**Theme:** Multi-vendor platform — suppliers sell through HASAN SHOP.

**Planned scope:**

- Vendor onboarding and KYC
- Per-vendor catalog and inventory isolation
- Commission and payout engine
- Vendor admin portal
- Split shipments and multi-supplier orders
- Dispute resolution workflow
- Marketplace search and ranking

---

### v4.0.0 — AI Platform

**Theme:** Intelligent commerce — recommendations, support, and operations.

**Planned scope:**

- AI product recommendations (personalized, not rule-based)
- Conversational order support (WhatsApp / chat)
- Demand forecasting and auto-reorder
- Fraud detection on COD orders
- Dynamic pricing suggestions for operators
- Natural-language analytics queries for admin

---

## Release Candidate 1 (RC1)

**Target version tag:** `v1.0.0-rc.1`  
**Status:** **NOT READY** — launch blockers remain  
**Scorecard:** [RELEASE_SCORE.md](./RELEASE_SCORE.md)

### RC1 definition

RC1 is the first build that could ship to production **if every launch blocker is resolved**. It is not a feature freeze—it is a **production readiness freeze**: no P0 gaps in security, deployment, testing, or compliance.

### RC1 entry criteria (all must pass)

| # | Gate | Owner | Status |
|---|------|-------|--------|
| 1 | `pnpm ci` green on clean machine (Docker + full test suite) | Engineering | ⚠️ Pending verification |
| 2 | Zero high dependency vulnerabilities (`pnpm audit`) | Engineering | ✅ Pass |
| 3 | API line coverage ≥ 85% | Engineering | ✅ 85.01% |
| 4 | 14 E2E tests pass without skips | Engineering | ⚠️ Requires running stack |
| 5 | 20 integration tests pass in CI | Engineering | ✅ Configured |
| 6 | Production deployment artifacts (Dockerfiles or documented PaaS) | DevOps | ❌ Missing |
| 7 | `.env.example` complete and accurate | Engineering | ❌ Gaps |
| 8 | Malware scanner bound for uploads | Security | ❌ No-op scanner |
| 9 | Notification providers configured (staging) | Ops | ❌ Not configured |
| 10 | Webhook secrets + carrier credentials (staging) | Ops | ❌ Not configured |
| 11 | SEO minimum: sitemap, robots, favicon | Product | ❌ Missing |
| 12 | Root `README.md` with setup + deploy | Engineering | ❌ Missing |
| 13 | Accessibility P0 fixes (cart +/-, admin checkboxes) | Frontend | ❌ Open |
| 14 | Backup automation or verified external cron | Ops | ❌ Docs only |
| 15 | Stale docs reconciled (`OPEN_TASKS`, `BUGS`) | Engineering | ❌ Stale |

### RC1 exit → v1.0.0 GA

1. RC1 deployed to staging for ≥ 14 days
2. Full checkout → fulfillment → shipment happy path verified manually
3. Restore drill completed (Postgres + MinIO)
4. Security sign-off (internal review minimum; pen-test recommended)
5. Operations sign-off (on-call runbook, alerting wired)
6. Product sign-off (ar/fr copy review, legal pages)

---

## Release calendar (indicative)

| Phase | Version | Target window | Depends on |
|-------|---------|---------------|------------|
| RC1 | `v1.0.0-rc.1` | Q3 2026 | Launch blockers cleared |
| GA | `v1.0.0` | Q3–Q4 2026 | RC1 soak + sign-offs |
| UX | `v1.1.0` | Q4 2026 – Q1 2027 | v1.0.0 stable |
| Marketing | `v1.2.0` | Q1–Q2 2027 | v1.1.0 |
| Mobile | `v2.0.0` | 2027 | v1.2.0 + API stability |
| Marketplace | `v3.0.0` | 2028+ | v2.0.0 traction |
| AI | `v4.0.0` | 2029+ | v3.0.0 data volume |

*Dates are planning estimates. RC1 date is blocked on engineering completion, not calendar.*

---

## Branching and tagging strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code; protected |
| `develop` | Integration branch for next minor |
| `release/v1.0.0` | RC stabilization (bugfixes only) |
| `feature/*` | Feature work targeting next minor |

**Tagging:**

```
v1.0.0-rc.1   → first release candidate
v1.0.0-rc.2   → blocker fixes
v1.0.0        → general availability
v1.0.1        → patch (hotfix)
```

---

## Quality gates per release type

| Release | Required before tag |
|---------|---------------------|
| RC | Green CI, launch checklist ≥ 90% P0, scorecard published |
| Minor | Green CI, changelog, no open P0 bugs, regression E2E |
| Major | Architecture review, migration plan, deprecation notices |
| Patch | Green CI, targeted test plan, rollback verified |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELEASE_SCORE.md](./RELEASE_SCORE.md) | Category scores and remaining work |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | RC1 / v1.0.0 launch blockers |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Day-of-deploy verification |
| [CI_PIPELINE.md](./CI_PIPELINE.md) | Automated quality gate |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Test layers and targets |
| [OPEN_TASKS.md](./OPEN_TASKS.md) | Engineering backlog (to be migrated to release issues) |

---

## CTO decision log

| Date | Decision |
|------|----------|
| 2026-07-10 | Adopt semver release cycle; RC1 is immediate gate before v1.0.0 |
| 2026-07-10 | Milestone labels (M1–M3.5) retired for planning; retained in changelog only |
| 2026-07-10 | RC1 **not approved** until all items in `LAUNCH_CHECKLIST.md` P0 are ✅ |
