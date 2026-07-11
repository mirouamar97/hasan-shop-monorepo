# HASAN SHOP — Production Checklist

**Use on:** Production deployment day (v1.0.0 GA, not RC1 staging)  
**Last updated:** 2026-07-10  
**Prerequisite:** [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) RC1 complete

---

## Pre-deploy (T-24 hours)

### Secrets and configuration

| # | Check | Command / verification |
|---|-------|------------------------|
| 1 | `AUTH_SECRET` is unique, ≥ 32 characters, not the example value | `openssl rand -base64 48` |
| 2 | `DATABASE_URL` points to production Postgres (not localhost) | Connection test |
| 3 | `REDIS_URL` points to production Redis | `redis-cli ping` |
| 4 | `MEILISEARCH_HOST` + `MEILISEARCH_API_KEY` set | `curl $MEILISEARCH_HOST/health` |
| 5 | `S3_*` variables point to production object storage | Upload test file |
| 6 | `NEXT_PUBLIC_API_URL` matches production API domain | Inspect built JS bundle |
| 7 | `NEXT_PUBLIC_APP_URL` matches production storefront domain | Check metadata |
| 8 | `APP_URL` + `ADMIN_URL` match CORS origins in API | Review `main.ts` CORS |
| 9 | `WEBHOOK_SECRET_DEFAULT` + per-carrier secrets set | Non-empty in secret store |
| 10 | `RESEND_API_KEY` + `RESEND_FROM_EMAIL` set | Send test email |
| 11 | `WHATSAPP_WEBHOOK_URL` set (if notifications enabled) | Send test message |
| 12 | `SEED_ADMIN_PASSWORD` **not** used in production (create real admin) | Manual account |
| 13 | `NODE_ENV=production` on all app processes | Env inspect |
| 14 | `LOG_LEVEL=info` or `warn` (not `debug`) | Env inspect |

### Infrastructure

| # | Check |
|---|-------|
| 15 | Postgres backups scheduled and last backup < 24 h old |
| 16 | MinIO / S3 backups scheduled |
| 17 | Redis persistence enabled (AOF or RDB) |
| 18 | TLS certificates valid (API, admin, storefront domains) |
| 19 | DNS records propagated (A/CNAME) |
| 20 | Firewall: only 443 public; DB/Redis/Meili not exposed |
| 21 | Carrier credentials in `carrier_configs` table verified |

### Code and artifacts

| # | Check |
|---|-------|
| 22 | Deploying tagged commit (`v1.0.0`, not `main` HEAD) |
| 23 | `pnpm ci` passed on the tagged commit |
| 24 | Database migrations reviewed (`0000`–`0003`) |
| 25 | Rollback plan documented (previous image tag + DB rollback) |

---

## Deploy sequence

Execute in order. Do not skip health checks.

### Step 1 — Database

```bash
# Backup before migrate
pg_dump "$DATABASE_URL" -Fc -f "pre-deploy-$(date +%Y%m%d).dump"

# Apply migrations
pnpm db:migrate
```

| # | Verify |
|---|--------|
| 26 | Migration completes without error |
| 27 | `\dt` shows 41 tables |
| 28 | No pending migrations in drizzle journal |

### Step 2 — Infrastructure services

| # | Verify |
|---|--------|
| 29 | Postgres accepting connections |
| 30 | Redis `PING` → `PONG` |
| 31 | Meilisearch `/health` → 200 |
| 32 | Object storage bucket exists and writable |

### Step 3 — API

```bash
# Deploy API container / process
# Wait for health
curl -sf https://api.yourdomain.dz/api/v1/health
```

| # | Verify |
|---|--------|
| 33 | Health returns `"status":"ok"` |
| 34 | `"database":"up"` |
| 35 | `"redis":"up"` |
| 36 | `"meilisearch":"up"` |
| 37 | Login works: `POST /api/v1/auth/login` (admin) |
| 38 | CSRF token issued: `GET /api/v1/auth/csrf` |

### Step 4 — Admin + Storefront

| # | Verify |
|---|--------|
| 39 | Admin loads at `https://admin.yourdomain.dz` |
| 40 | Admin login → dashboard |
| 41 | Storefront loads at `https://yourdomain.dz/ar` |
| 42 | Storefront loads at `https://yourdomain.dz/fr` |
| 43 | Product page renders with images |
| 44 | `robots.txt` and `sitemap.xml` accessible |

### Step 5 — Smoke test (production)

| # | Flow | Expected |
|---|------|----------|
| 45 | Browse products | List loads |
| 46 | Add to cart | Cart shows item |
| 47 | Checkout (test wilaya) | Quote returns shipping cost |
| 48 | Place test order | Order number returned |
| 49 | Track order | Status visible |
| 50 | Admin: view order | Order appears in list |
| 51 | Admin: update status | Transition succeeds |
| 52 | Cancel test order | Inventory released |

---

## Post-deploy (T+1 hour)

### Monitoring

| # | Check |
|---|-------|
| 53 | API error rate < 1% (5xx) |
| 54 | API p95 latency < 500 ms |
| 55 | No OOM or restart loops in container logs |
| 56 | Disk usage on Postgres volume < 80% |
| 57 | Alerting rules active (health, error rate, disk) |

### Security

| # | Check |
|---|-------|
| 58 | `curl -I` shows security headers (HSTS, X-Frame-Options, CSP) |
| 59 | Admin not indexed (`X-Robots-Tag` or meta robots) |
| 60 | HTTP redirects to HTTPS |
| 61 | Webhook endpoint rejects unsigned payloads |

### Business

| # | Check |
|---|-------|
| 62 | Yalidine quote returns real rates (if carrier active) |
| 63 | Order confirmation email received (if Resend configured) |
| 64 | WhatsApp notification received (if enabled) |
| 65 | Search returns seeded products |

---

## Rollback procedure

If critical failure within 1 hour of deploy:

1. **Stop traffic** — switch load balancer to previous version
2. **Rollback apps** — deploy previous container tags
3. **Rollback DB** (only if migration caused issue):
   ```bash
   pg_restore -d hasan_shop pre-deploy-YYYYMMDD.dump
   ```
4. **Verify** previous version health endpoints
5. **Notify** stakeholders; open incident record

---

## Post-deploy (T+24 hours)

| # | Check |
|---|-------|
| 66 | Review application logs for errors |
| 67 | Review audit log for unexpected admin actions |
| 68 | Confirm backup ran successfully overnight |
| 69 | Check order volume and conversion (if live traffic) |
| 70 | Update status page / announce launch |

---

## Emergency contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-call engineer | _fill before launch_ | P0 production down |
| Database admin | _fill before launch_ | Data corruption |
| Security | _fill before launch_ | Breach suspected |
| Carrier (Yalidine) | _fill before launch_ | Shipping API down |

---

## Sign-off

| Role | Name | Date | Production go-live approved |
|------|------|------|----------------------------|
| CTO | | | ⬜ |
| Ops | | | ⬜ |
| Security | | | ⬜ |
| Product | | | ⬜ |
