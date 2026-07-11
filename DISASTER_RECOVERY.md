# HASAN SHOP — Disaster Recovery (RC1)

**Last updated:** 2026-07-10  
**Scope:** PostgreSQL, Redis, MinIO, Meilisearch, automated backups, RPO/RTO, drill schedule  
**Extends:** [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)

---

## Overview

| Store | Criticality | Backup method | RPO | RTO |
|-------|-------------|---------------|-----|-----|
| PostgreSQL | **Critical** | Automated `pg_dump` (Compose sidecar) + manual dumps | **24h** (daily default) | **1–2h** |
| MinIO | High | Bucket mirror / provider versioning | 24h | 2–4h |
| Redis | Medium | AOF/RDB (ephemeral acceptable) | 1h | 30 min |
| Meilisearch | Low | Reindex from Postgres | N/A | 1h |

Orders, inventory, customers, and audit data live in **PostgreSQL** — restore priority #1.

---

## Automated backup service (RC1)

Production Compose includes a **`backup`** sidecar (`docker-compose.prod.yml`) that runs `docker/backup/backup-cron.sh`.

### Behavior

| Setting | Default | Description |
|---------|---------|-------------|
| `BACKUP_ENABLED` | `true` | Set `false` to idle the container |
| `BACKUP_INTERVAL_SEC` | `86400` (24h) | Loop interval between dumps |
| `BACKUP_RETENTION_DAYS` | `30` | Deletes `hasan_shop_*.sql.gz` older than N days |
| `BACKUP_SCHEDULE` | `0 2 * * *` | Documented cron equivalent (sidecar uses interval, not crontab) |

### Backup file format

```
/backups/hasan_shop_YYYYMMDD_HHMMSS.sql.gz
```

- Logical SQL dump via `pg_dump --no-owner --no-acl`, gzip-compressed
- Stored in Docker volume `backup_data`
- **Not encrypted at rest by default** — encrypt before off-site copy in production

### Manual backup (host)

```bash
bash docker/backup/backup.sh
# or
docker exec hasan-shop-backup /bin/sh -c 'BACKUP_DIR=/backups /usr/local/bin/backup-cron.sh'
```

See [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) for development `docker exec pg_dump` commands.

---

## Restore procedures

### PostgreSQL — production (recommended)

1. **Announce maintenance window** — scale API, admin, storefront to zero
2. **Identify backup** — latest `hasan_shop_*.sql.gz` within RPO window
3. **Restore to staging clone first** (never restore directly to production without validation)

```bash
# On staging clone
gunzip -c /backups/hasan_shop_20260710_020000.sql.gz | \
  PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h postgres -U hasan_shop -d hasan_shop
```

4. **Validate row counts** — orders, products, users vs pre-incident baseline
5. **Run migrations** if schema drift: `pnpm --filter @hasan-shop/database migrate`
6. **Swap `DATABASE_URL`** to restored instance (or restore in-place after stop)
7. **Scale apps up** — verify `/api/v1/health`, admin login, sample order lookup
8. **Reindex Meilisearch** if search index is stale

### PostgreSQL — local Docker (destructive)

See [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) — `pg_restore` / plain SQL restore with `docker compose stop`.

### MinIO

1. Stop upload writers (API scale-down)
2. Restore from `mc mirror` backup or R2/S3 versioning
3. Verify `S3_PUBLIC_URL` resolves product images on storefront
4. No Postgres restore required for image-only incidents

### Redis

**Prefer empty rebuild** for session/cache data. PostgreSQL is source of truth for orders and inventory.

If restore required:

```powershell
docker compose stop redis
docker cp ./backups/redis_backup.rdb hasan-shop-redis:/data/dump.rdb
docker compose start redis
```

**Acceptable loss:** active sessions, guest carts, webhook nonce cache (10 min replay window).

### Meilisearch

1. Clear product index
2. Re-run product indexing from admin catalog sync or dedicated script
3. Verify storefront search returns expected products

---

## RPO / RTO summary

| Scenario | RPO | RTO | Notes |
|----------|-----|-----|-------|
| Accidental table drop | 24h (default backup interval) | 1–2h | Reduce RPO with more frequent dumps or managed DB PITR |
| Postgres corruption | 24h | 2h | Validate on staging clone before cutover |
| MinIO bucket loss | 24h | 2–4h | Enable bucket versioning in cloud |
| Full host loss | 24h (off-site backup dependent) | 4–8h | Requires provisioned infra + deploy scripts |
| Redis loss | N/A (rebuild) | 30 min | Users re-login; guest carts lost |

**RC1 gap:** Off-site backup copy is **not automated** — `backup_data` volume is local to the Docker host. Production must mirror dumps to object storage or remote backup service.

---

## Disaster recovery runbooks

### Scenario: Postgres corruption / accidental drop

1. Stop all application processes (`docker compose stop api admin storefront`)
2. Identify latest valid backup within RPO
3. Restore to **staging clone** first
4. Validate schema version (`pnpm db:migrate` dry-run) and row counts
5. Promote restored instance to production `DATABASE_URL`
6. Run `bash scripts/deploy/validate-deployment.sh`
7. Resume traffic; monitor error rates and order lookups

### Scenario: MinIO bucket deleted

1. Restore from `mc mirror` or provider versioning
2. Verify image URLs on storefront PDP and admin catalog
3. No Postgres restore needed

### Scenario: Full host loss

1. Provision new host (Postgres, Redis, Meilisearch, MinIO or managed equivalents)
2. Restore Postgres from **off-site** encrypted dump
3. Restore MinIO from mirror
4. Deploy: `bash scripts/deploy/deploy.sh` with production `.env.production`
5. Run migrations (idempotent)
6. Reindex Meilisearch
7. Full verification: `validate-deployment.sh`, integration tests, manual checkout smoke

### Scenario: ClamAV unavailable

- API rejects uploads when `CLAMAV_REQUIRED=true` and scanner unreachable
- **Workaround (incident only):** set `CLAMAV_REQUIRED=false` and accept upload risk — document in incident log
- **Recovery:** restart `clamav` container; allow 2+ min for signature load

---

## Drill schedule

| Drill | Frequency | Owner | Success criteria |
|-------|-----------|-------|------------------|
| **Postgres restore to staging** | Monthly | Ops | Row counts match; admin login; order visible |
| **Full stack redeploy** | Quarterly | DevOps | `deploy.sh` + `validate-deployment.sh` pass on staging |
| **MinIO restore sample** | Quarterly | Ops | 10 random product images load |
| **Tabletop: full host loss** | Semi-annual | CTO + Ops | Runbook walkthrough ≤60 min |
| **Post-migration restore** | After every schema migration | Engineering | Restore pre-migration backup to staging |

### Drill log template

| Date | Drill type | Environment | Duration | Result | Issues | Next action |
|------|------------|-------------|----------|--------|--------|-------------|
| | Postgres restore | staging | | Pass/Fail | | |

**RC1 status:** No restore drill executed in this sprint. LB-6 backup **automation** is implemented; **verification** is pending.

---

## Post-restore validation

```bash
bash scripts/deploy/validate-deployment.sh
pnpm --filter @hasan-shop/api test:integration   # requires DATABASE_URL
```

Manual checks:

- [ ] Order count matches pre-incident baseline (± expected delta)
- [ ] Admin login works
- [ ] Recent orders visible in admin dashboard
- [ ] Storefront product search returns results
- [ ] Upload + ClamAV scan path functional

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `BACKUP_ENABLED` | Enable backup sidecar loop |
| `BACKUP_INTERVAL_SEC` | Seconds between dumps (default 86400) |
| `BACKUP_RETENTION_DAYS` | Local retention (default 30) |
| `BACKUP_SCHEDULE` | Cron documentation (default `0 2 * * *`) |
| `POSTGRES_HOST` | Backup target host (default `postgres` in Compose) |

---

## Related documents

- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) — detailed per-store backup commands
- [DEPLOYMENT_VALIDATION.md](./DEPLOYMENT_VALIDATION.md) — deploy and health validation
- [OPERATIONS.md](./OPERATIONS.md) — day-to-day ops runbook
