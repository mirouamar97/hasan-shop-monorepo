# HASAN SHOP — Backup & Recovery (M3.5)

**Last Updated**: 2026-07-10  
**Scope**: PostgreSQL, Redis, MinIO object storage

---

## Overview

| Store | Criticality | Backup method | RPO target | RTO target |
|-------|-------------|---------------|------------|------------|
| PostgreSQL | **Critical** | `pg_dump` / managed snapshots | 24h (daily) | 1–2h |
| Redis | Medium | RDB snapshot / AOF | 1h | 30 min |
| MinIO | High | Bucket replication / `mc mirror` | 24h | 2–4h |
| Meilisearch | Low | Reindex from Postgres | N/A | 1h |

Orders, inventory, customers, and audit data live in **PostgreSQL** — prioritize this store above all others.

---

## PostgreSQL

### Local backup (development)

```powershell
docker exec hasan-shop-postgres pg_dump -U hasan_shop -d hasan_shop -Fc -f /tmp/hasan_shop_backup.dump
docker cp hasan-shop-postgres:/tmp/hasan_shop_backup.dump ./backups/hasan_shop_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump
```

Plain SQL format (human-readable):

```powershell
docker exec hasan-shop-postgres pg_dump -U hasan_shop -d hasan_shop > ./backups/hasan_shop.sql
```

### Production backup

Use managed provider snapshots (RDS, Supabase, Neon, etc.) **plus** logical dumps:

```bash
pg_dump "$DATABASE_URL" -Fc -f hasan_shop_$(date +%Y%m%d).dump
```

Encrypt backups at rest. Retention: **30 days** (configurable via `BACKUP_RETENTION_DAYS`).

### Scheduled backup (cron)

When `BACKUP_ENABLED=true`, schedule via `BACKUP_SCHEDULE` (default `0 2 * * *` — 02:00 daily).

Example cron on backup host:

```bash
0 2 * * * pg_dump "$DATABASE_URL" -Fc | gpg --encrypt -r backup@hasan-shop.dz > /backups/hasan_shop_$(date +\%Y\%m\%d).dump.gpg
```

### Restore — local

**Warning**: Restore overwrites existing data. Stop the API first.

```powershell
# Stop writers
docker compose stop

# Drop and recreate (destructive)
docker exec -i hasan-shop-postgres psql -U hasan_shop -d postgres -c "DROP DATABASE IF EXISTS hasan_shop;"
docker exec -i hasan-shop-postgres psql -U hasan_shop -d postgres -c "CREATE DATABASE hasan_shop;"

# Restore custom format dump
docker cp ./backups/hasan_shop_backup.dump hasan-shop-postgres:/tmp/restore.dump
docker exec hasan-shop-postgres pg_restore -U hasan_shop -d hasan_shop --no-owner /tmp/restore.dump

docker compose start
```

Restore from plain SQL:

```powershell
Get-Content ./backups/hasan_shop.sql | docker exec -i hasan-shop-postgres psql -U hasan_shop -d hasan_shop
```

### Restore — production

1. Announce maintenance window
2. Scale API/admin/storefront to zero
3. Restore to a **new** database instance first (validate row counts)
4. Run `pnpm --filter @hasan-shop/database migrate` if schema drift exists
5. Swap `DATABASE_URL` to restored instance
6. Verify `/api/v1/health` and sample order lookup
7. Scale apps back up

### Post-restore validation

```powershell
pnpm verify:stack
pnpm --filter @hasan-shop/api test:ci
```

Check:

- Order count matches pre-incident baseline
- Admin login works
- Recent orders visible in admin dashboard

---

## Redis

Redis holds ephemeral and recoverable data:

| Key pattern | Data | Loss impact |
|-------------|------|-------------|
| Session cookies | Active sessions | Users re-login |
| `login:attempt:*` | Lockout counters | Temporary — DB has durable lock |
| `webhook:nonce:*` | Replay protection | Brief window of duplicate webhook risk |
| Guest cart/favorites | Guest engagement | Carts rebuilt on next visit |

### Backup

Redis persists to `redis_data` volume via RDB snapshots (default Redis behavior).

Manual snapshot:

```powershell
docker exec hasan-shop-redis redis-cli BGSAVE
docker cp hasan-shop-redis:/data/dump.rdb ./backups/redis_$(Get-Date -Format 'yyyyMMdd').rdb
```

### Restore

```powershell
docker compose stop redis
# Copy dump.rdb to volume (or recreate container with volume mount)
docker cp ./backups/redis_backup.rdb hasan-shop-redis:/data/dump.rdb
docker compose start redis
```

**Production note**: Prefer rebuilding Redis from empty state for session/cache data unless investigating a specific incident. PostgreSQL is the source of truth for orders and inventory.

---

## MinIO (Object Storage)

Product images and uploads are stored in the `hasan-shop` bucket (configurable via `S3_BUCKET`).

### Backup with MinIO Client (`mc`)

```powershell
# Configure alias (one-time)
docker exec hasan-shop-minio mc alias set local http://localhost:9000 hasan_shop_minio hasan_shop_minio_secret

# Mirror bucket to host
docker exec hasan-shop-minio mc mirror local/hasan-shop /tmp/backup/hasan-shop
docker cp hasan-shop-minio:/tmp/backup/hasan-shop ./backups/minio_hasan-shop
```

### Production (Cloudflare R2 / AWS S3)

Enable:

- Versioning on the bucket
- Cross-region replication (CRR) or lifecycle rules
- Periodic `mc mirror` or provider-native backup to cold storage

### Restore

```powershell
docker exec hasan-shop-minio mc mirror /tmp/backup/hasan-shop local/hasan-shop
```

After restore, verify image URLs via storefront product pages and admin catalog.

---

## Meilisearch

Search index is **rebuildable** from PostgreSQL product data. No backup required if reindex tooling exists.

Recovery:

1. Clear Meilisearch index
2. Re-run product indexing job (admin catalog sync or dedicated script)
3. Verify storefront search returns seeded products

---

## Disaster Recovery Runbook

### Scenario: Postgres corruption / accidental drop

1. Stop all application processes
2. Identify latest valid backup (within RPO)
3. Restore to staging clone first
4. Validate schema version and row counts
5. Promote restored instance to production `DATABASE_URL`
6. Run health + smoke + E2E on staging
7. Resume traffic

### Scenario: MinIO bucket deleted

1. Restore from `mc mirror` backup or R2 versioning
2. Verify `S3_PUBLIC_URL` resolves images
3. No Postgres restore needed

### Scenario: Full host loss

1. Provision new infrastructure (Postgres, Redis, Meilisearch, MinIO)
2. Restore Postgres from off-site encrypted dump
3. Restore MinIO from mirror
4. Deploy application containers with production env vars
5. Run migrations (idempotent)
6. Reindex Meilisearch
7. Full verification: `verify:stack`, `test:e2e`, manual checkout smoke

---

## Backup Checklist

- [ ] Daily encrypted Postgres dumps to off-site storage
- [ ] Weekly restore drill on staging (quarterly minimum)
- [ ] MinIO/R2 versioning enabled
- [ ] Redis treated as ephemeral — document acceptable loss window
- [ ] `BACKUP_RETENTION_DAYS` aligned with compliance requirements
- [ ] Runbook tested after major schema migration

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BACKUP_ENABLED` | Enable scheduled backup jobs |
| `BACKUP_SCHEDULE` | Cron expression (default `0 2 * * *`) |
| `BACKUP_RETENTION_DAYS` | Days to retain dumps (default `30`) |
