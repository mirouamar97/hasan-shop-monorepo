# HASAN SHOP — Operations Guide (M3.5)

**Last Updated**: 2026-07-10  
**Audience**: DevOps, on-call engineers, release managers

---

## Docker Stack

Start all infrastructure services:

```powershell
docker compose up -d
```

Verify with the stack script:

```powershell
pnpm verify:stack
```

### Services

| Service | Container | Host Port | Purpose |
|---------|-----------|-----------|---------|
| PostgreSQL 16 | `hasan-shop-postgres` | **5433** → 5432 | Primary datastore |
| Redis 7 | `hasan-shop-redis` | 6379 | Sessions, lockout, cart cache, webhook nonces |
| Meilisearch 1.14 | `hasan-shop-meilisearch` | 7700 | Product search |
| MinIO | `hasan-shop-minio` | 9000 (API), 9001 (console) | S3-compatible object storage |

### Volumes

Persistent data is stored in Docker named volumes:

- `postgres_data`
- `redis_data`
- `meilisearch_data`
- `minio_data`

See `BACKUP_RECOVERY.md` for backup procedures.

### Health checks

Each service defines a Docker healthcheck in `docker-compose.yml`. Wait for healthy status before running migrations:

```powershell
docker compose ps
```

---

## Database Migrations

Migrations are managed by Drizzle in `packages/database/`.

| Command | Action |
|---------|--------|
| `pnpm db:generate` | Generate SQL from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Insert baseline data (roles, admin, products, geo) |
| `pnpm db:studio` | Open Drizzle Studio GUI |

### Migration files

| File | Milestone | Contents |
|------|-----------|----------|
| `0001_security_hardening.sql` | M1.5 | Audit, lockout columns |
| `0002_order_workflow_m2.sql` | M2 | Orders lifecycle, cart |
| `0003_m3_operations.sql` | M3 | Fulfillment, inventory, CRM, analytics |

### Production migration procedure

1. Take a Postgres backup (see `BACKUP_RECOVERY.md`).
2. Set `DATABASE_URL` with SSL (`?sslmode=require`).
3. Run `pnpm --filter @hasan-shop/database migrate`.
4. Verify `/api/v1/health` reports `database: up`.
5. Run smoke tests or `pnpm verify:stack`.

**Never** run `db:seed` in production unless intentionally re-seeding a fresh environment.

---

## Seed Data

Seed is idempotent (`onConflictDoNothing` / `onConflictDoUpdate`).

### Key seeded entities

- **Admin**: `admin@hasan-shop.dz` (password from `SEED_ADMIN_PASSWORD`)
- **Roles**: `super_admin`, `fulfillment_agent`, `analyst`, etc.
- **Products**: `montre-intelligente`, `ecouteurs-sans-fil`, etc.
- **Geo**: 58 wilayas + communes
- **Carriers**: Yalidine (enabled), stub carriers (disabled)
- **Supplier**: `fournisseur-local-principal`
- **Notification templates**: order created/delivered email + WhatsApp

```powershell
$env:SEED_ADMIN_PASSWORD = "YourSecurePassword"
pnpm db:seed
```

---

## Environment Variables

Copy `.env.example` to `.env`. Critical groups:

### Application

| Variable | Local | Production |
|----------|-------|------------|
| `NODE_ENV` | `development` | `production` |
| `APP_URL` | `http://localhost:3000` | `https://hasan-shop.dz` |
| `ADMIN_URL` | `http://localhost:3001` | `https://admin.hasan-shop.dz` |
| `API_URL` | `http://localhost:4000` | `https://api.hasan-shop.dz` |

### Data stores

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (port 5433 locally) |
| `REDIS_URL` | Redis connection string |
| `MEILISEARCH_HOST` | Meilisearch base URL |
| `MEILISEARCH_API_KEY` | Meilisearch master key |

### Auth & security

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | 64+ char session signing secret |
| `SEED_ADMIN_PASSWORD` | Dev/staging admin password for seed |
| `WEBHOOK_SECRET_DEFAULT` | HMAC secret for carrier webhooks |
| `WEBHOOK_SECRET_YALIDINE` | Per-carrier override (optional) |

### Storage & integrations

| Variable | Description |
|----------|-------------|
| `S3_*` | MinIO locally; Cloudflare R2 or AWS S3 in production |
| `YALIDINE_API_ID` / `YALIDINE_API_TOKEN` | Live carrier credentials |
| `RESEND_API_KEY` | Transactional email |
| `LOG_LEVEL` / `LOG_FORMAT` | Structured logging (`json` in prod) |

Full reference: `.env.example` and `DEPLOYMENT.md`.

---

## Application Processes

### Development (all apps)

```powershell
pnpm dev
```

Starts via Turborepo:

- API — `http://localhost:4000`
- Storefront — `http://localhost:3000`
- Admin — `http://localhost:3001`

### Production build

```powershell
pnpm build
pnpm --filter @hasan-shop/api start:prod
```

Next.js apps are deployed as standalone Node processes or container images behind a reverse proxy.

---

## Deployment Checklist

1. **Infrastructure**: Postgres, Redis, Meilisearch, object storage provisioned
2. **Secrets**: `AUTH_SECRET`, `DATABASE_URL`, `WEBHOOK_SECRET_*`, carrier API keys
3. **Migrations**: Applied and verified
4. **Health**: `/api/v1/health` returns `status: ok`
5. **Smoke**: `curl` health + public settings endpoints
6. **E2E** (staging): `pnpm test:e2e` against staging URLs
7. **Monitoring**: Log shipping + alerts configured (see `MONITORING.md`)
8. **Backups**: Scheduled Postgres backups enabled (see `BACKUP_RECOVERY.md`)

Detailed production topology: `DEPLOYMENT.md`.

---

## Common Operations

| Task | Command |
|------|---------|
| Restart Docker stack | `docker compose restart` |
| View API logs | Check process manager / container logs |
| Reset local DB | `docker compose down -v` then `up -d`, migrate, seed |
| Typecheck all packages | `pnpm typecheck` |
| Full test suite | `pnpm test:ci` |
| Coverage summary | `scripts/generate-coverage-report.ps1` |

---

## Port Reference (Local)

| Port | Service |
|------|---------|
| 3000 | Storefront |
| 3001 | Admin |
| 4000 | API |
| 5433 | PostgreSQL (host) |
| 6379 | Redis |
| 7700 | Meilisearch |
| 9000 | MinIO S3 API |
| 9001 | MinIO Console |
