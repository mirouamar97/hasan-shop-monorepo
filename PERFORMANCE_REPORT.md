# HASAN SHOP — Performance Report (M3)

**Report Date**: 2026-07-10  
**Scope**: Query indexes, caching opportunities, bundle notes for M3 operations modules

---

## Executive Summary

M3 adds targeted database indexes for fulfillment, inventory audit trails, CRM lookups, order list queries, and shipment event retrieval. No application-level caching layer was introduced in M3. Carrier registry is loaded once at module init (in-memory).

**Performance posture**: Adequate for current scale; caching recommended before high-traffic production.

---

## Query Indexes Added (Migration `0003_m3_operations.sql`)

### Inventory movements

| Index | Columns | Purpose |
|-------|---------|---------|
| `inventory_movements_product_idx` | `product_id` | Movement history per product (`listMovements`) |
| `inventory_movements_created_at_idx` | `created_at` | Time-ordered audit queries |

### Fulfillment tasks

| Index | Columns | Purpose |
|-------|---------|---------|
| `fulfillment_tasks_order_stage_idx` | `(order_id, stage)` **UNIQUE** | Fast task lookup; prevents duplicate stages |
| `fulfillment_tasks_order_id_idx` | `order_id` | Workflow listing per order |

### Customer CRM

| Index | Columns | Purpose |
|-------|---------|---------|
| `customer_notes_customer_idx` | `customer_id` | Notes by customer |
| `customer_notes_phone_idx` | `phone` | Phone-based CRM lookup |
| `customer_tags_customer_idx` | `customer_id` | Tags by customer |
| `customer_tags_tag_idx` | `tag` | `listByTag` queries |

### Orders (admin list)

| Index | Columns | Purpose |
|-------|---------|---------|
| `orders_status_created_at_idx` | `(status, created_at DESC)` | Filtered admin order lists by status + recency |

### Shipment events

| Index | Columns | Purpose |
|-------|---------|---------|
| `shipment_events_shipment_id_idx` | `shipment_id` | Event timeline per shipment; webhook processing |

### Order number sequences

| Table | Purpose |
|-------|---------|
| `order_number_sequences` | Collision-safe daily order number generation inside checkout transaction |

---

## Query Hot Paths & Index Coverage

| Operation | Repository | Index used |
|-----------|------------|------------|
| Fulfillment workflow | `DrizzleFulfillmentRepository.findByOrderId` | `fulfillment_tasks_order_id_idx` |
| Task start/complete | `findTask` / update by `(order_id, stage)` | `fulfillment_tasks_order_stage_idx` |
| Checkout atomic | `placeOrderAtomic` | `inventory` row lock via PK; movements by product |
| Shipment webhook | `findByTrackingNumber` | Existing `shipments.tracking_number` unique constraint |
| Shipment events | `listEvents` | `shipment_events_shipment_id_idx` |
| Low stock list | `listLowStock` | **Full table scan** on `inventory` — see recommendations |
| Analytics aggregates | `DrizzleAnalyticsRepository` | Uses `orders_status_created_at_idx` for status+date filters |
| Supplier auto-assign | `findBestSupplierForProduct` | `suppliers` filtered by `is_active`, ordered by `lead_time_days` |

---

## Caching Recommendations

### High impact

| Target | Strategy | Rationale |
|--------|----------|-----------|
| Carrier registry | Redis cache with TTL + invalidation on config change | Currently rebuilt on `onModuleInit` only; config updates require restart |
| Analytics overview | Redis cache, 5–15 min TTL | Aggregate queries over `orders` + `order_items` are expensive at scale |
| Default carrier config | In-memory with Redis pub/sub invalidation | Quoted on every checkout and admin quote |

### Medium impact

| Target | Strategy | Rationale |
|--------|----------|-----------|
| Low stock list | Materialized view or Redis counter | `listLowStock` scans all inventory rows |
| Yalidine rate quotes | Short TTL cache keyed by `(from, to, commune, weight)` | External API latency on every admin quote |
| CRM profile by phone | Redis cache per phone, invalidate on note/tag write | Repeated lookups during order confirmation |

### Low impact (defer)

| Target | Notes |
|--------|-------|
| Fulfillment tasks | Low volume per order (4 rows); indexes sufficient |
| Supplier list | Small table; infrequent changes |

---

## Bundle Notes

### `@hasan-shop/carrier-adapters` package

| Component | Size impact | Notes |
|-----------|-------------|-------|
| `YalidineAdapter` | Minimal | Uses native `fetch`; no heavy SDK |
| `StubCarrierAdapter` | Negligible | Pure TypeScript, no dependencies |
| Registry factory | Negligible | Loaded server-side only |

**Tree-shaking**: Package is API-only (NestJS backend). Not bundled into admin/storefront client bundles.

### API module registration

M3 adds 6 NestJS modules to `AppModule`:
- `ShippingModule`, `FulfillmentModule`, `InventoryModule`, `SuppliersModule`, `AnalyticsModule`, `CrmModule`

Each module follows lazy repository injection via `RepositoriesModule` tokens. No circular dependency chains detected.

### Test bundle impact

M3 unit tests added (Vitest):
- `fulfillment.service.test.ts`
- `shipping.service.test.ts`
- `automation.service.test.ts`
- `drizzle-checkout.repository.test.ts`

These run server-side only; no frontend bundle impact.

### Frontend (admin/storefront)

M3 does **not** ship admin UI pages for fulfillment, shipping, or suppliers in this milestone. No new client-side bundles for M3 features. When UI is added:
- Prefer dynamic imports for analytics charts
- Keep carrier config forms out of storefront bundle entirely

---

## Transaction Performance

### Checkout atomic transaction

`placeOrderAtomic` holds a DB transaction across:
- Stock checks + decrements (per item)
- Order + items insert
- Status history insert
- Cart clear
- Order number sequence upsert

**Risk at scale**: Long transactions under high concurrency on popular SKUs.

**Mitigation**: Row-level locking on `inventory` PK is implicit via UPDATE; consider `SELECT ... FOR UPDATE` for explicit pessimistic locking if oversell races appear under load testing.

---

## External API Latency

| Call | Typical latency | Frequency |
|------|-----------------|-----------|
| Yalidine `/fees/` | 200–800 ms | Admin quote |
| Yalidine `/parcels/` | 500–2000 ms | Shipment create |
| Yalidine `/parcels/:id/history` | 200–600 ms | Track (live events) |

Auto-shipment on `ready_to_ship` runs synchronously in status-change handler. Failures are caught and logged — no retry queue in M3.

**Recommendation**: Move shipment creation to a background job queue (BullMQ/Redis) for production.

---

## Performance Score

| Milestone | Score |
|-----------|-------|
| M1.5 baseline | 72 / 100 |
| M3 adjusted | **74 / 100** (+indexes; −full-scan low stock, no caching) |

---

## Next Performance Targets

1. Add Redis cache for carrier registry and analytics overview
2. Add `SELECT FOR UPDATE` on inventory during checkout if load tests show races
3. Background job queue for Yalidine parcel creation
4. Partial index on `inventory` for `track_inventory = true` products (low stock)
5. Connection pool tuning documentation for production Postgres
