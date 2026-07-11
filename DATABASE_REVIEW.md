# HASAN SHOP — Database Review

**Report date:** 2026-07-10  
**Engine:** PostgreSQL 16  
**ORM:** Drizzle 0.45.2  
**Schema version:** Migration `0003` (4 migrations total)  
**Database score:** **88 / 100**

---

## Executive summary

The database layer is **well-designed for v1.0 launch scale**. Forty-one tables cover the full commerce domain with appropriate constraints, indexes, and foreign keys. Four incremental migrations show disciplined schema evolution. Gaps are operational (backup automation, enum sync verification) rather than structural.

---

## Migration inventory

| # | File | Date (journal) | Purpose | Risk |
|---|------|----------------|---------|------|
| 0 | `0000_windy_warbound.sql` | Initial | Users, catalog, orders, shipping, payments, geo, audit | Baseline |
| 1 | `0001_security_hardening.sql` | M1.5 | Login lockout columns on `users` | Low |
| 2 | `0002_order_workflow_m2.sql` | M2 | Order status enum migration, idempotency, cart uniqueness, notifications | Medium — enum rewrite |
| 3 | `0003_m3_operations.sql` | M3 | Fulfillment, inventory movements, CRM, supplier fields, indexes | Low |

**Runner:** `packages/database/src/migrate.ts`  
**Journal:** `packages/database/drizzle/meta/_journal.json`  
**Commands:** `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:generate`

### Pre-production checklist

| # | Action | Status |
|---|--------|--------|
| 1 | Run all migrations on staging | ⬜ |
| 2 | Run all migrations on production (with backup) | ⬜ |
| 3 | Verify no pending migrations after deploy | ⬜ |
| 4 | Seed geo data (`seed-geo.ts`) if not in main seed | 🔄 |

---

## Schema overview

**Source:** `packages/database/src/schema/index.ts`

| Domain | Tables | Key entities |
|--------|--------|--------------|
| Auth | 4 | `users`, `roles`, `sessions`, `permissions` |
| Customers | 2 | `customers`, `addresses` |
| Geo (Algeria) | 2 | `wilayas`, `communes` |
| Catalog | 8 | `categories`, `brands`, `products`, `variants`, `images`, `inventory` |
| Commerce | 6 | `carts`, `cart_items`, `orders`, `order_items`, `order_status_history` |
| Fulfillment | 2 | `fulfillment_tasks`, `order_number_sequences` |
| Shipping | 4 | `carriers`, `carrier_configs`, `shipments`, `shipment_events` |
| Payments | 2 | `payments`, `cod_reconciliation` |
| Engagement | 3 | `reviews`, `wishlists`, `recently_viewed` |
| Operations | 6 | `suppliers`, `inventory_movements`, `customer_notes`, `customer_tags`, `notification_templates`, `notification_logs` |
| System | 4 | `store_settings`, `feature_flags`, `audit_logs`, `idempotency_keys` |

**Total:** 41 tables, 14 enums

---

## Constraints and integrity

### Unique constraints (critical)

| Table | Constraint | Business rule |
|-------|------------|---------------|
| `users` | `email` | One account per email |
| `products` | `sku`, `slug` | Catalog identity |
| `orders` | `order_number` | Public tracking |
| `orders` | `idempotency_key` (partial) | Duplicate order prevention |
| `inventory` | `(product_id, variant_id)` | One stock row per variant |
| `fulfillment_tasks` | `(order_id, stage)` | One task per stage |
| `cart_items` | `(cart_id, product_id, variant_id)` | No duplicate cart lines |
| `carrier_configs` | `carrier` | One config per carrier |

### Foreign keys

- Comprehensive FK graph in `0000` migration
- `ON DELETE CASCADE` on order children (items, shipments)
- `ON DELETE SET NULL` on `orders.customer_id`, `assigned_operator_id`

### Gaps

| Issue | Severity | Detail |
|-------|----------|--------|
| `customer_tags` no unique on `(customer_id, tag)` | Low | Duplicate tags possible |
| `audit_action` enum may not include all app values | Low | Verify `login_failed`, `lockout`, `restore` in DB enum |
| `carrier_configs.credentials` JSONB | Medium | Ensure never exposed in API responses |

---

## Indexes

### Hot query paths (indexed)

| Table | Index | Query pattern |
|-------|-------|---------------|
| `orders` | `status`, `created_at`, `customer_id`, `shipping_phone` | Admin list, track |
| `orders` | `(status, created_at DESC)` | Filtered dashboard |
| `products` | `category_id`, `brand_id`, `supplier_id`, `status` | Catalog browse |
| `shipments` | `order_id`, `tracking_number`, `status` | Shipping ops |
| `inventory_movements` | `product_id`, `created_at` | Audit trail |
| `audit_logs` | `user_id`, `(entity_type, entity_id)`, `created_at` | Compliance |
| `sessions` | `user_id`, `expires_at` | Auth cleanup |

### Recommendations

| # | Index | Reason | Priority |
|---|-------|--------|----------|
| 1 | `products(slug)` — verify unique covers lookups | PDP by slug | ✅ Exists as unique |
| 2 | `notification_logs(created_at)` | Log retention queries | P2 |
| 3 | Partial index on `orders(status)` WHERE active | Fulfillment queue | P2 |

---

## Data types and enums

| Enum | Values | Used by |
|------|--------|---------|
| `order_status` | 12 states (M2 migration) | Order lifecycle |
| `payment_status` | pending, paid, failed, refunded | Payments |
| `shipment_status` | created, in_transit, delivered, ... | Shipping |
| `fulfillment_stage` | picking, packing, quality_check, ready_to_ship | Fulfillment |
| `carrier_type` | yalidine, zr_express, ... | Carrier configs |
| `audit_action` | create, update, delete, ... | Audit logs |

**Migration 0002** rewrote `order_status` enum — ensure production migration tested on copy of prod data.

---

## Seed data

| Script | Purpose |
|--------|---------|
| `packages/database/src/seed.ts` | Admin user, roles, catalog sample, carriers, settings |
| `packages/database/src/seed-geo.ts` | Algeria wilayas and communes |

**Production:** Do not run full seed on production. Use seed only for initial admin + geo; import catalog via admin.

---

## Connection and pooling

| Setting | Development | Production recommendation |
|---------|-------------|--------------------------|
| Host | `localhost:5433` | Managed Postgres or dedicated VM |
| Driver | `postgres` (postgres.js) | Same |
| Pool size | Default | 10–20 per API instance |
| SSL | Off | **Required** (`?sslmode=require`) |
| Timezone | `Africa/Algiers` (init.sql) | Maintain for COD business hours |

---

## Backup and recovery

**Documentation:** `BACKUP_RECOVERY.md` (complete runbook)

| Store | Method | RPO | RTO |
|-------|--------|-----|-----|
| PostgreSQL | `pg_dump` / managed snapshots | 24 h | 1–2 h |
| Redis | RDB/AOF | 1 h | 30 m |
| MinIO | `mc mirror` | 24 h | 2–4 h |
| Meilisearch | Reindex from Postgres | N/A | 1 h |

### Gap

`BACKUP_ENABLED`, `BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS` env vars documented but **no automated job in codebase** — launch blocker LB-6.

### Restore drill (required before GA)

1. `pg_restore` to staging from production backup
2. Run `pnpm db:migrate` — verify no drift
3. API health check against restored DB
4. Spot-check order count and latest order

---

## Security

| Control | Status |
|---------|--------|
| Parameterized queries (Drizzle) | ✅ |
| SQL injection (ORM CVE patched) | ✅ drizzle-orm 0.45.2 |
| Credentials in connection string | Env var only |
| Row-level security (RLS) | ❌ Not used — app-layer RBAC |
| Encryption at rest | Deploy-dependent (Postgres volume) |
| Least-privilege DB user | ⬜ Create `hasan_shop_app` without superuser for prod |

**Recommendation:** Production DB user with `SELECT, INSERT, UPDATE, DELETE` only — no `DDL` privileges.

---

## Scalability notes

| Concern | v1.0 capacity | Future |
|---------|---------------|--------|
| Single Postgres instance | Sufficient for Algeria COD launch | Read replica for analytics (v1.2) |
| Order write volume | Transactional checkout handles concurrency | Partition `orders` by month if > 1M rows |
| Search | Offloaded to Meilisearch | Reindex job on catalog change |
| Audit log growth | Unbounded | Retention policy + archive (P2) |

---

## Score breakdown

| Area | Score |
|------|-------|
| Schema design | 92 |
| Constraints & integrity | 90 |
| Index coverage | 88 |
| Migration discipline | 90 |
| Operations (backup, pooling) | 70 |
| Security | 88 |
| **Weighted** | **88** |

---

## Related documents

- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) — operational procedures
- [API_REVIEW.md](./API_REVIEW.md) — API data access patterns
- [RELEASE_SCORE.md](./RELEASE_SCORE.md) — Scalability category
