# HASAN SHOP — Launch Checklist (RC1 → v1.0.0)

**Target:** Release Candidate 1  
**Last updated:** 2026-07-10  
**RC1 status:** 🟡 **Technically Ready – Awaiting Environment** — 0 code blockers; LB-3 (config), LB-7 (Docker) pending

Use this checklist before tagging `v1.0.0-rc.1`. Every P0 item must be ✅. P1 items should be ✅ or explicitly deferred with CTO approval.

---

## How to use

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete and verified |
| ⏭️ | Deferred (requires CTO sign-off) |

Record verifier name and date in the **Verified** column when marking ✅.

---

## P0 — Launch blockers (must be ✅ for RC1)

| ID | Item | Owner | Status | Verified |
|----|------|-------|--------|----------|
| LB-1 | **Deployment artifacts** — Dockerfiles for API, admin, storefront OR documented PaaS deploy with build/start commands | DevOps | ✅ | 2026-07-10 |
| LB-2 | **Malware scanner** — replace `NoOpVirusScanner` with ClamAV (or cloud scanner) in production | Security | ✅ | 2026-07-10 |
| LB-3 | **Notifications** — Resend API key + from-address; WhatsApp webhook URL configured in staging | Ops | ⬜ Configuration | `.env.staging.example` ready |
| LB-4 | **Carrier config** — Yalidine credentials in `carrier_configs`; `WEBHOOK_SECRET_DEFAULT` + per-carrier secrets set | Ops | ✅ Code / ⬜ Config | 2026-07-10 |
| LB-5 | **Environment template** — `.env.example` includes `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `WEBHOOK_SECRET_*`, `RESEND_FROM_EMAIL`; production values in secret store | Engineering | ✅ | 2026-07-10 |
| LB-6 | **Backup automation** — scheduled `pg_dump` + MinIO mirror OR verified external cron with restore drill log | Ops | ✅ | 2026-07-10 |
| LB-7 | **CI green** — `pnpm ci` passes on clean machine (Docker running); artifacts uploaded | Engineering | ⬜ Environment | Docker daemon offline 2026-07-10 |
| LB-8 | **SEO minimum** — `sitemap.ts`, `robots.ts`, favicon in `apps/storefront/public/` | Frontend | ✅ | 2026-07-10 |
| LB-9 | **Root README.md** — architecture overview, prerequisites, local setup, deploy pointer | Engineering | ✅ | 2026-07-10 |
| LB-10 | **Guest cookie security** — `secure: true` on cart/engagement cookies when `NODE_ENV=production` | Security | ✅ | 2026-07-10 |
| LB-11 | **Accessibility P0** — cart +/- button labels; admin checkbox `aria-label`; `aria-live` on form errors | Frontend | ✅ | 2026-07-10 |
| LB-12 | **Doc reconciliation** — `OPEN_TASKS.md` P0-07/08 marked done; `BUGS.md` BUG-029/030 marked fixed | Engineering | ✅ | 2026-07-10 |

---

## Engineering — Build & test

| # | Item | Status | Verified |
|---|------|--------|----------|
| 1 | `pnpm install --frozen-lockfile` succeeds | ✅ | 2026-07-10 |
| 2 | `pnpm lint` — zero errors | ✅ | 2026-07-10 |
| 3 | `pnpm typecheck` — zero errors (11/11 packages) | ✅ | 2026-07-10 |
| 4 | `pnpm build` — all packages | ✅ | 2026-07-10 |
| 5 | `pnpm test:coverage` — API ≥ 85% line coverage | ✅ | **85.03%** 2026-07-10 |
| 6 | `pnpm test:integration` — 20 tests pass in CI | 🔄 | CI configured |
| 7 | `pnpm test:e2e:ci` — 14 tests, zero skips | 🔄 | Requires stack |
| 8 | `pnpm audit` — zero high vulnerabilities | ✅ | 2026-07-10 |
| 9 | No `TODO`/`FIXME` in production code paths | 🔄 | Review needed |
| 10 | `CHANGELOG.md` updated for RC1 | ⬜ | |

---

## Infrastructure — Docker & data

| # | Item | Status | Verified |
|---|------|--------|----------|
| 1 | `docker compose up -d --wait` — postgres, redis, meilisearch, minio healthy | 🔄 | |
| 2 | `pnpm db:migrate` — all 4 migrations applied | ⬜ | |
| 3 | `pnpm db:seed` — admin + catalog + geo data | ⬜ | |
| 4 | Postgres port 5433 documented and consistent | ✅ | |
| 5 | MinIO bucket `hasan-shop` created (upload path works) | ⬜ | |
| 6 | Meilisearch index populated (product search returns results) | ⬜ | |
| 7 | Redis persistence policy configured for production | ✅ | AOF in prod compose |

---

## API — All modules reviewed

| Module | Endpoints | Auth | Tests | Status |
|--------|-----------|------|-------|--------|
| Health | 1 | Public | Unit | ✅ |
| Auth | 4 | Mixed | Unit + integration | ✅ |
| Geo | 2 | Public | Integration | ✅ |
| Catalog (products, categories, brands) | 6 | Public read | Unit + integration | ✅ |
| Search | 1 | Public | Unit | ✅ |
| Cart | 5 | Guest session | Integration | ✅ |
| Checkout | 3 | Guest session | Integration | ✅ |
| Orders (track) | 1 | Public | Integration | ✅ |
| Engagement | 7 | Guest session | Integration | ✅ |
| Settings | 3 | Admin | Unit | ✅ |
| Admin products/categories/brands | 18 | RBAC | Unit | ✅ |
| Admin orders | 10 | RBAC | Unit + integration | ✅ |
| Admin shipping/fulfillment | 11 | RBAC | Unit + integration | ✅ |
| Admin inventory/suppliers/CRM | 14 | RBAC | Unit + integration | ✅ |
| Admin analytics | 7 | RBAC | Unit | ✅ |
| Webhooks | 1 | Signature | Unit | ✅ |
| Uploads | 1 | RBAC | Unit | ✅ ClamAV |

---

## Frontend — All pages reviewed

### Storefront (10 routes)

| Page | ar | fr | Functional | a11y | SEO |
|------|----|----|------------|------|-----|
| Home | ✅ | ✅ | ✅ | 🔄 | ✅ |
| Products list | ✅ | ✅ | ✅ | 🔄 | ✅ |
| Product detail | ✅ | ✅ | ✅ | ✅ | ✅ metadata + JSON-LD |
| Category | ✅ | ✅ | ✅ | 🔄 | ✅ metadata |
| Cart | ✅ | ✅ | ✅ | ✅ LB-11 | 🔄 |
| Checkout | ✅ | ✅ | ✅ | 🔄 | 🔄 |
| Checkout success | ✅ | ✅ | ✅ | 🔄 | 🔄 |
| Favorites | ✅ | ✅ | ✅ | 🔄 | 🔄 |
| Track | ✅ | ✅ | ✅ | 🔄 | 🔄 |

### Admin (14 routes)

| Page | Functional | a11y | Status |
|------|------------|------|--------|
| Login | ✅ | ✅ | ✅ |
| Dashboard | ✅ | 🔄 | ✅ |
| Orders list + detail | ✅ | ✅ LB-11 | ✅ |
| Catalog (products, categories, brands) | ✅ | ✅ LB-11 | ✅ |
| Fulfillment | ✅ | 🔄 | ✅ |
| Inventory | ✅ | 🔄 | ✅ |
| Suppliers | ✅ | 🔄 | ✅ |
| Customers (CRM) | ✅ | 🔄 | ✅ |
| Analytics | ✅ | 🔄 | ✅ |

---

## Security rules reviewed

| Control | Implemented | Production verified |
|---------|-------------|-------------------|
| CSRF (admin) | ✅ | ⬜ |
| RBAC permissions | ✅ | ⬜ |
| Session rotation on login | ✅ | ⬜ |
| Login lockout | ✅ | ⬜ |
| Password policy | ✅ | ⬜ |
| Helmet / CSP | ✅ | ⬜ |
| Webhook HMAC + replay | ✅ | ⬜ LB-4 code done |
| File upload validation | ✅ | ⬜ |
| Virus scan (ClamAV) | ✅ | ⬜ LB-2 code done |
| Rate limiting (global) | ✅ | ⬜ |
| Audit logging (auth, catalog, settings) | ✅ | ⬜ |
| Audit logging (M3 modules) | ⬜ | ⬜ |
| `AUTH_SECRET` ≥ 32 chars in prod | ✅ validation | ⬜ |
| Guest cookies `secure: true` in prod | ✅ LB-10 | ⬜ |

---

## Translations reviewed

| Locale | Keys | Parity | Hardcoded strings |
|--------|------|--------|-------------------|
| ar | 95 | ✅ | Phone placeholder, brand name |
| fr | 95 | ✅ | Same gaps as ar |
| Admin | N/A | English only | All UI (acceptable for RC1) |

---

## CI pipeline reviewed

| Step | Documented | Implemented | Verified green |
|------|------------|-------------|----------------|
| Install + lint + typecheck | ✅ | ✅ | ✅ |
| Build all packages | ✅ | ✅ | ✅ |
| Docker up + health wait | ✅ | ✅ | ⬜ LB-7 |
| Migrate + seed | ✅ | ✅ | ⬜ |
| Start apps + health wait | ✅ | ✅ | ⬜ |
| Unit tests + coverage | ✅ | ✅ | ❌ 78.24% |
| Integration tests | ✅ | ✅ | ⬜ |
| Playwright E2E (14 tests) | ✅ | ✅ | ⬜ |
| Artifact upload | ✅ | ✅ | ⬜ |
| `pnpm audit` in CI | ✅ | ✅ | ✅ |

---

## Documentation reviewed

| Document | Accurate | Action needed |
|----------|----------|---------------|
| RELEASE_PLAN.md | ✅ | — |
| RELEASE_SCORE.md | 🔄 | Update post-RC1 scores |
| RELEASE_AUDIT.md | ✅ | New — RC1 governance |
| RC1_FINAL_REPORT.md | ✅ | Superseded by RELEASE_AUDIT.md |
| DEPLOYMENT_VALIDATION.md | ✅ | New |
| DISASTER_RECOVERY.md | ✅ | New |
| SECURITY_RC1_REPORT.md | ✅ | New |
| SEO_AUDIT_RC1.md | ✅ | New |
| ACCESSIBILITY_RC1.md | ✅ | New |
| CI_PIPELINE.md | ✅ | — |
| TEST_STRATEGY.md | ✅ | — |
| OPERATIONS.md | ✅ | — |
| OPEN_TASKS.md | ✅ | RC1 section added |
| BUGS.md | ✅ | BUG-018/029/030 closed |
| SECURITY_AUDIT_REPORT.md | ✅ | — |
| README.md | ✅ | LB-9 |

---

## Sign-off

| Role | Name | Date | RC1 approved |
|------|------|------|--------------|
| CTO / Engineering lead | | | ❌ |
| Security | | | ❌ |
| Operations | | | ❌ |
| Product | | | ❌ |

**RC1 is complete only when all P0 launch blockers are ✅ and sign-offs recorded.**

See [RELEASE_AUDIT.md](./RELEASE_AUDIT.md) for measured scores, blocker classification, and approval status.
