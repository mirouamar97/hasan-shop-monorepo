# Deployment Guide

**Project**: HASAN SHOP  
**Target**: Production deployment on containerized infrastructure  
**Environments**: `development` | `staging` | `production`

---

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │  CDN + WAF + TLS│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     hasan-shop.dz   admin.hasan-shop.dz  api.hasan-shop.dz
     (Storefront)      (Admin)              (API)
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │  (Nginx/Caddy)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   Next.js (×2)        Next.js (×1)        NestJS (×2)
   storefront          admin                api
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
    ┌────────────┬───────────┼───────────┬────────────┐
    ▼            ▼           ▼           ▼            ▼
 PostgreSQL   Redis    Meilisearch    MinIO/R2    Yalidine
 (managed)    (managed)  (managed)     (S3)        API
```

---

## Local Development

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Node.js 20+ and pnpm 9+

### Start Infrastructure

```bash
docker compose up -d
```

Services started:

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 16 | `hasan-shop-postgres` | 5432 |
| Redis 7 | `hasan-shop-redis` | 6379 |
| Meilisearch 1.14 | `hasan-shop-meilisearch` | 7700 |
| MinIO | `hasan-shop-minio` | 9000, 9001 |

### Initialize Application

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Drizzle Studio (optional)

```bash
pnpm db:studio
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure per environment.

### Required (Production)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `APP_URL` | `https://hasan-shop.dz` |
| `ADMIN_URL` | `https://admin.hasan-shop.dz` |
| `API_URL` | `https://api.hasan-shop.dz` |
| `DATABASE_URL` | PostgreSQL connection string with SSL |
| `REDIS_URL` | Redis connection string |
| `AUTH_SECRET` | 64+ char random string |
| `MEILISEARCH_HOST` | Meilisearch URL |
| `MEILISEARCH_API_KEY` | Meilisearch master/search key |
| `S3_ENDPOINT` | Object storage endpoint |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Storage credentials |
| `S3_BUCKET` | Bucket name |
| `S3_PUBLIC_URL` | CDN URL for public assets |
| `YALIDINE_API_ID` / `YALIDINE_API_TOKEN` | Shipping API credentials |
| `RESEND_API_KEY` | Email provider |
| `EMAIL_FROM` | Sender address |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_SESSION_EXPIRY_HOURS` | 168 | Session lifetime |
| `LOG_LEVEL` | info | Pino log level |
| `OTEL_ENABLED` | false | OpenTelemetry tracing |
| `BACKUP_ENABLED` | true | Enable automated backups |
| `BACKUP_SCHEDULE` | `0 2 * * *` | Cron schedule (UTC) |
| `BACKUP_RETENTION_DAYS` | 30 | Backup retention |

---

## Docker Production Builds

### API (`apps/api`)

```dockerfile
# docker/api.Dockerfile (representative)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @hasan-shop/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nestjs
EXPOSE 4000
CMD ["node", "dist/main.js"]
```

### Storefront & Admin (`apps/storefront`, `apps/admin`)

Multi-stage Next.js standalone builds with `output: 'standalone'` in `next.config.ts`.

```bash
docker build -f docker/storefront.Dockerfile -t hasan-shop/storefront:latest .
docker build -f docker/admin.Dockerfile -t hasan-shop/admin:latest .
docker build -f docker/api.Dockerfile -t hasan-shop/api:latest .
```

### Production Compose (excerpt)

```yaml
services:
  api:
    image: hasan-shop/api:latest
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M

  storefront:
    image: hasan-shop/storefront:latest
    restart: unless-stopped
    env_file: .env.production
    deploy:
      replicas: 2

  admin:
    image: hasan-shop/admin:latest
    restart: unless-stopped
    env_file: .env.production
    deploy:
      replicas: 1
```

---

## CI/CD Pipeline

**File**: `.github/workflows/ci.yml`

### Triggers

- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Jobs

| Job | Steps |
|-----|-------|
| **lint-and-typecheck** | `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` |
| **test** | Postgres + Redis services → migrate → `pnpm test:ci` |
| **build** | `pnpm build` (after lint and test pass) |

### Deployment Pipeline (Production — planned M5)

```yaml
# .github/workflows/deploy.yml (planned)
on:
  push:
    branches: [main]

jobs:
  deploy:
    needs: [ci]
    steps:
      - Build and push Docker images to registry
      - Run database migrations
      - Rolling deploy to production cluster
      - Smoke test /health endpoints
      - Notify on failure
```

### Branch Strategy

| Branch | Environment |
|--------|-------------|
| `develop` | Staging (auto-deploy) |
| `main` | Production (auto-deploy after approval) |
| `feature/*` | Preview deployments (optional) |

---

## Database Migrations

### Development

```bash
pnpm db:generate   # After schema changes
pnpm db:migrate
```

### Production

Migrations run as a **pre-deploy job**, not on app startup:

```bash
pnpm --filter @hasan-shop/database migrate
```

Rules:

1. Migrations are forward-only (no destructive changes without backup)
2. Test migrations on staging with production-size snapshot
3. Zero-downtime: additive columns first, backfill, then remove old columns in separate release

---

## HTTPS & DNS

### DNS Records

| Host | Type | Target |
|------|------|--------|
| `hasan-shop.dz` | A / CNAME | CDN or load balancer |
| `www.hasan-shop.dz` | CNAME | `hasan-shop.dz` |
| `admin.hasan-shop.dz` | CNAME | Load balancer |
| `api.hasan-shop.dz` | CNAME | Load balancer |

### TLS

- Cloudflare Full (Strict) or Let's Encrypt via Caddy
- Auto-renewal enabled
- HSTS: `max-age=31536000; includeSubDomains; preload`

### Reverse Proxy (Caddy example)

```caddyfile
hasan-shop.dz {
    reverse_proxy storefront:3000
}

admin.hasan-shop.dz {
    reverse_proxy admin:3001
}

api.hasan-shop.dz {
    reverse_proxy api:4000
}
```

---

## Backups

### PostgreSQL

| Setting | Value |
|---------|-------|
| Schedule | Daily at 02:00 UTC (`BACKUP_SCHEDULE`) |
| Method | `pg_dump` compressed (gzip) |
| Storage | S3 bucket `hasan-shop-backups` |
| Retention | 30 days (`BACKUP_RETENTION_DAYS`) |
| Encryption | AES-256 server-side |

```bash
# Manual backup
pg_dump "$DATABASE_URL" | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload
aws s3 cp backup-*.sql.gz s3://hasan-shop-backups/postgres/
```

### Restore Procedure

```bash
# 1. Stop API instances (prevent writes)
# 2. Restore
gunzip -c backup-20260709.sql.gz | psql "$DATABASE_URL"
# 3. Verify row counts
# 4. Restart API instances
# 5. Smoke test
```

### Redis

- Redis data is ephemeral (sessions, cache) — no backup required
- Session invalidation acceptable on Redis failure (users re-login)

### Meilisearch

- Reindex from PostgreSQL if index lost: `pnpm --filter @hasan-shop/api search:reindex`

### Object Storage

- S3 versioning enabled on product images bucket
- Cross-region replication optional for disaster recovery

---

## Monitoring & Observability

### Health Checks

| Endpoint | Interval | Timeout |
|----------|----------|---------|
| `GET /api/v1/health` | 30s | 5s |
| Storefront `/` | 60s | 10s |

### Metrics (OpenTelemetry — `OTEL_ENABLED=true`)

- Request rate, latency (p50, p95, p99), error rate per endpoint
- Database connection pool utilization
- Redis hit/miss ratio
- Order creation rate

### Logging

- JSON structured logs to stdout
- Aggregated via Loki, Datadog, or CloudWatch
- Correlation via `X-Request-ID`

### Alerting Thresholds

| Alert | Condition |
|-------|-----------|
| API down | Health check fails 3 consecutive times |
| High error rate | 5xx > 1% over 5 minutes |
| Slow responses | p95 > 2s over 10 minutes |
| Disk space | PostgreSQL volume > 80% |
| Backup failure | No successful backup in 25 hours |
| Failed logins | > 50 failures in 10 minutes from single IP |

### Uptime Target

- **99.5%** monthly availability (~3.6 hours downtime/month)

---

## Scaling Guidelines

| Load | Action |
|------|--------|
| < 100 orders/day | Single API instance, managed DB smallest tier |
| 100–500 orders/day | 2 API instances, Redis managed, Meilisearch dedicated |
| 500+ orders/day | Horizontal API scaling, read replica for analytics, CDN for images |

### Caching Strategy

| Data | TTL | Store |
|------|-----|-------|
| Public settings | 5 min | Redis |
| Category tree | 15 min | Redis |
| Product detail | 5 min | Redis |
| Wilayas/communes | 24 hours | Redis |
| Search results | No cache (Meilisearch is fast) |

---

## Staging Environment

Mirror production with:

- Separate database and Redis instances
- Yalidine sandbox/test API credentials
- `NODE_ENV=staging`
- Subdomain: `staging.hasan-shop.dz`

Use staging for:

- Migration testing
- Carrier integration testing
- UAT before production releases

---

## Rollback Procedure

1. Identify failing deployment via monitoring
2. Revert to previous Docker image tag: `docker service update --image hasan-shop/api:previous`
3. If migration caused issue: restore database from pre-deploy backup
4. Verify health checks
5. Post-mortem within 24 hours

---

## Pre-Launch Checklist

- [ ] All environment variables set in production vault
- [ ] DNS propagated and TLS valid
- [ ] Database migrated and seeded (geo data only; no test orders)
- [ ] Yalidine production credentials configured
- [ ] Email sending verified (Resend)
- [ ] Backups scheduled and restore tested
- [ ] Monitoring and alerts configured
- [ ] Security gate passed (see SECURITY.md)
- [ ] Load test: 100 concurrent checkout simulations
- [ ] Admin super user password rotated from seed default

---

## Related Documents

- [README.md](./README.md) — Quick start
- [SECURITY.md](./SECURITY.md) — Security controls
- [ROADMAP.md](./ROADMAP.md) — M5 deployment milestone
