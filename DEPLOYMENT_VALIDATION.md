# HASAN SHOP — Deployment Validation (RC1)

**Last updated:** 2026-07-10  
**Scope:** Docker production stack, reverse proxy, deploy scripts, health checks  
**Status:** Artifacts complete — **not verified on a clean machine in this sprint**

---

## Overview

RC1 adds a one-command Docker Compose production stack with multi-stage application images, ordered startup (migrations before API), nginx reverse proxy, ClamAV malware scanning, and an automated PostgreSQL backup sidecar.

| Artifact | Path |
|----------|------|
| API image | `Dockerfile.api` |
| Admin image | `Dockerfile.admin` |
| Storefront image | `Dockerfile.storefront` |
| Migration job | `Dockerfile.migrate` |
| Production stack | `docker-compose.prod.yml` |
| Deploy script | `scripts/deploy/deploy.sh` |
| Validation script | `scripts/deploy/validate-deployment.sh` |
| Nginx config | `docker/nginx/nginx.conf`, `docker/nginx/conf.d/default.conf` |

---

## Dockerfiles

### `Dockerfile.api`

- **Base:** `node:20-alpine` with `pnpm@9.15.4`
- **Stages:** `deps` → `builder` → `runner`
- **Builds:** `@hasan-shop/database`, `shared`, `logger`, `carrier-adapters`, `api`
- **Runtime user:** `apiuser` (uid 1001, non-root)
- **Port:** 4000
- **Health check:** `curl -sf http://localhost:4000/api/v1/health` every 15s (30s start period, 5 retries)
- **CMD:** `node dist/main.js`

### `Dockerfile.admin`

- **Build arg:** `NEXT_PUBLIC_API_URL` (baked at build time)
- **Output:** Next.js standalone (`apps/admin/server.js`)
- **Runtime user:** `nextjs` (uid 1001)
- **Port:** 3001
- **Health check:** `curl -sf http://localhost:3001/` every 15s (45s start period)

### `Dockerfile.storefront`

- **Build args:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`
- **Output:** Next.js standalone (`apps/storefront/server.js`)
- **Runtime user:** `nextjs` (uid 1001)
- **Port:** 3000
- **Health check:** `curl -sf http://localhost:3000/ar` every 15s (45s start period)

### `Dockerfile.migrate`

- **Purpose:** One-shot migration container
- **CMD:** `pnpm --filter @hasan-shop/database migrate`
- **No health check** — exits on completion (`restart: "no"` in Compose)

---

## `docker-compose.prod.yml`

### Service startup order

```
postgres (healthy)
    ├── migrate (completed_successfully)
    └── backup (healthy postgres)
         │
redis, meilisearch, minio, clamav (all healthy)
         │
api (depends on migrate + all infra healthy)
         │
admin, storefront (depend on api healthy)
         │
nginx (depends on api, admin, storefront healthy)
```

### Resource limits

| Service | CPU limit | Memory limit |
|---------|-----------|--------------|
| postgres | 2 | 2G |
| redis | 0.5 | 512M |
| meilisearch | 1 | 1G |
| minio | 1 | 1G |
| clamav | 1 | 2G |
| api | 2 | 1G |
| admin | 1 | 512M |
| storefront | 1 | 512M |
| nginx | 0.5 | 256M |
| backup | 0.5 | 256M |

### Infrastructure services

| Service | Image | Health probe |
|---------|-------|--------------|
| postgres | `postgres:16-alpine` | `pg_isready` |
| redis | `redis:7-alpine` | `redis-cli ping` (AOF enabled, 256MB maxmemory LRU) |
| meilisearch | `getmeili/meilisearch:v1.14` | `curl /health` |
| minio | `minio/minio:latest` | `curl /minio/health/live` |
| clamav | `clamav/clamav:1.4` | `clamdscan --ping` (120s start period) |
| backup | `postgres:16-alpine` | N/A (cron loop sidecar) |

### Application wiring

- API receives `CLAMAV_HOST=clamav`, `CLAMAV_PORT=3310`, internal service URLs for Postgres, Redis, Meilisearch, MinIO
- Admin/storefront receive `NODE_ENV=production` only at runtime; public URLs are build-time args
- Nginx exposes ports `${HTTP_PORT:-80}` and `${HTTPS_PORT:-443}` on `public` network; all other services on `internal`

---

## Nginx reverse proxy

**Config:** `docker/nginx/conf.d/default.conf`

| Path | Upstream | Rate limit |
|------|----------|------------|
| `/health` | Static 200 (orchestrator probe) | None |
| `/api/` | `api:4000` | 30 req/s, burst 50 |
| `/admin/` | `admin:3001` | 60 req/s, burst 30 |
| `/` (default) | `storefront:3000` | 60 req/s, burst 100 |

**Headers forwarded:** `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`  
**Security:** `server_tokens off`, `client_max_body_size 10M`

---

## Deploy scripts

### `scripts/deploy/deploy.sh`

1. Creates `.env.production` from `.env.production.example` if missing (warns to edit secrets)
2. `docker compose -f docker-compose.prod.yml build`
3. `docker compose up -d`
4. Runs `validate-deployment.sh`

**Usage:**

```bash
pnpm deploy
# or
bash scripts/deploy/deploy.sh
ENV_FILE=.env.production bash scripts/deploy/deploy.sh
```

### `scripts/deploy/validate-deployment.sh`

Polls endpoints for up to **300 seconds**:

| Check | URL | Assertion |
|-------|-----|-----------|
| API health | `${API_URL}/api/v1/health` | HTTP 200 |
| Database | health JSON | `"database":"up"` |
| Redis | health JSON | `"redis":"up"` |
| Storefront | `${NEXT_PUBLIC_APP_URL}/ar` | HTTP 200 |
| Admin | `${ADMIN_URL}/` | HTTP 200 |
| robots.txt | `${STORE_URL}/robots.txt` | HTTP 200 |
| sitemap.xml | `${STORE_URL}/sitemap.xml` | HTTP 200 |
| favicon.svg | `${STORE_URL}/favicon.svg` | HTTP 200 |

**Gap:** Does not validate nginx `/health`, ClamAV probe in API health, or HTTPS termination (TLS certs not included in RC1 compose).

---

## API health endpoint

`GET /api/v1/health` returns:

```json
{
  "status": "ok | degraded | error",
  "version": "0.1.0",
  "timestamp": "...",
  "services": {
    "database": "up | down",
    "redis": "up | down",
    "meilisearch": "up | down",
    "storage": "up | down",
    "clamav": "up | down"
  }
}
```

- **Core status** (`ok`/`error`) is based on database, redis, meilisearch only
- **Storage** and **ClamAV** are reported but do not downgrade core status to `error` when down (degraded reporting)

---

## Validation checklist

### Pre-deploy

- [ ] Copy `.env.production.example` → `.env.production`
- [ ] Replace all `REPLACE_*` secrets (`POSTGRES_PASSWORD`, `AUTH_SECRET`, `MEILISEARCH_API_KEY`, `S3_*`, `WEBHOOK_SECRET_*`, `RESEND_API_KEY`)
- [ ] Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` to public URLs used in browser
- [ ] Confirm `CLAMAV_HOST=clamav` and `CLAMAV_REQUIRED=true`
- [ ] Set `SEED_ON_DEPLOY=false` for production

### Build & start

- [ ] `docker compose -f docker-compose.prod.yml --env-file .env.production build` succeeds
- [ ] `migrate` container exits 0 before API starts
- [ ] All infrastructure health checks pass within start periods
- [ ] ClamAV container reaches healthy (allow ≥2 min on first pull)

### Post-deploy smoke

- [ ] `bash scripts/deploy/validate-deployment.sh` exits 0
- [ ] API health shows `database: up`, `redis: up`, `clamav: up`
- [ ] Storefront `/ar` loads; admin login page loads
- [ ] `robots.txt`, `sitemap.xml`, `favicon.svg` return 200
- [ ] Upload test file through admin (ClamAV scan path)
- [ ] Backup sidecar writes `hasan_shop_*.sql.gz` to `backup_data` volume

### Not verified in RC1 sprint

- [ ] Full deploy on a **clean machine** (no prior images/volumes)
- [ ] `pnpm ci` green with Docker (LB-7)
- [ ] TLS/HTTPS with real certificates
- [ ] Restore drill from automated backup

---

## Known gaps

1. **Clean-machine deploy not executed** — scripts and compose are written but end-to-end validation on fresh host is pending
2. **LB-7 CI** — full `pnpm ci` pipeline not confirmed green in this environment
3. **HTTPS** — nginx listens on 443 but no cert volume/mount is configured in RC1
4. **Admin URL routing** — nginx proxies `/admin/` but default dev URLs use port 3001 directly; production URL scheme must match nginx paths

---

## Related documents

- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) — backup restore procedures
- [SECURITY_RC1_REPORT.md](./SECURITY_RC1_REPORT.md) — ClamAV and env validation
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — LB-1, LB-6, LB-7 status
