# HASAN SHOP — Business Rules (M3)

**Last Updated**: 2026-07-10  
**Scope**: Inventory, overselling prevention, order automation, COD rules

---

## Inventory Management

### Stock model

Each inventory row tracks:
- `quantity` — on-hand stock
- `reservedQuantity` — units held for pending operations (reserve/release path)
- `lowStockThreshold` — per-SKU alert threshold (default `5`)

Available stock = `quantity - reservedQuantity`.

### Checkout deduction (primary overselling prevention)

`DrizzleCheckoutRepository.placeOrderAtomic` runs in a **single database transaction**:

1. Re-check available stock per line item (`quantity - reservedQuantity >= requested`)
2. Decrement `quantity` immediately (movement type `sale`)
3. Insert `inventory_movements` audit row
4. Create order + order items + status history
5. Clear cart items

If stock is insufficient, the transaction rolls back with `Insufficient stock for product {id}`.

### Pre-checkout validation

`CheckoutService.resolveSingleLineItem` validates stock **before** the atomic transaction when `trackInventory` is enabled:

```
available = stock.quantity - stock.reservedQuantity
if available < quantity → 400 Bad Request
```

This provides early feedback; the atomic transaction is the authoritative guard against race conditions.

### Reserve / release path

`InventoryService.reserve` and `release` manage `reservedQuantity` without changing `quantity`. Used for:
- **Reserve**: optional pre-order holds (not used in standard checkout flow)
- **Release**: on order cancellation via `AutomationService.releaseOrderInventory`

Checkout M3 path deducts `quantity` directly; cancellation releases via the reserve/release mechanism on order items.

### Admin adjustments

`POST /api/v1/admin/inventory/products/:productId/adjust`:
- Requires `catalog:write`
- Records movement with `movementType`, `quantityChange`, actor, optional note
- Rejects zero-quantity changes

### Low-stock alerts

`InventoryService.checkLowStockAlerts` runs after every order status change (automation). Items where `available <= lowStockThreshold` are logged at `warn` level.

`GET /api/v1/admin/inventory?lowStockThreshold=N` lists low-stock SKUs.

### Inventory sync

`POST /api/v1/admin/inventory/sync/:productId` creates a zero-quantity inventory row for track-inventory products that lack one.

---

## Overselling Prevention Summary

| Layer | Mechanism | When |
|-------|-----------|------|
| Cart display | Available qty in `DrizzleCartRepository` | Add-to-cart / cart view |
| Checkout validation | Pre-transaction stock check | `placeOrder` / `buyNow` |
| Atomic transaction | Stock decrement inside DB tx | Order creation |
| Quantity limits | 1–99 per line item | Checkout |
| Product status | Only `active` products purchasable | Checkout |
| Variant check | Active variant required | Checkout with variant |

Concurrent checkouts for the last unit: only one transaction succeeds; the other receives `Insufficient stock`.

---

## Order Automation

`AutomationService` hooks into order lifecycle events.

### On order created

| Action | Detail |
|--------|--------|
| Notification | `sendOrderNotification(order, 'created')` |

### On status change

| To status | Automated actions |
|-----------|-------------------|
| `confirmed` | Initialize fulfillment workflow (4 tasks) |
| `ready_to_ship` | Attempt auto-create shipment (non-blocking on failure) |
| `cancelled` | Release reserved inventory for all line items |
| `confirmed` | Notification: `confirmed` |
| `shipped` | Notification: `shipped` |
| `delivered` | Notification: `delivered` |
| `cancelled` | Notification: `cancelled` |

After every status change: `checkLowStockAlerts()`.

### Fulfillment → order status

Completing `ready_to_ship` fulfillment stage when all stages are done/skipped promotes order `preparing` → `ready_to_ship`.

### Shipping webhook → order status

| Shipment status | Order transition |
|-----------------|------------------|
| `picked_up`, `in_transit`, `out_for_delivery` | `ready_to_ship` → `shipped` |
| `delivered` | `shipped` or `ready_to_ship` → `delivered` |

---

## COD Rules

### Payment method gating

`CheckoutService.assertPaymentAllowed` reads store settings:

| Setting | Rule |
|---------|------|
| `cod_enabled = 'false'` | Reject `paymentMethod: 'cod'` |
| `online_payment_enabled = 'false'` | Reject non-COD methods |

### COD in shipments

- Order `total` is sent as `codAmount` to carrier adapters
- `declaredValue` = order `subtotal`
- Yalidine insurance (`do_insurance`) enabled when `declaredValue > 10000`
- `freeShipping` flag passed when `shippingCost === 0`

### Duplicate order prevention

| Rule | Value |
|------|-------|
| Idempotency key | Required; returns existing order if key matches |
| Duplicate window | 5 minutes |
| Duplicate match | Same phone + same total |
| On duplicate | `409 Conflict` |

### Order number generation

Collision-safe daily sequence (`order_number_sequences` table):
- Format: `HS-YYYYMMDD-####`
- Generated inside checkout transaction

---

## Duplicate Prevention & Idempotency

```
placeOrder / buyNow
  → validate fields (Zod createOrderSchema)
  → assert payment allowed
  → check idempotency key (return existing order)
  → resolve line items + stock pre-check
  → check 5-min duplicate (phone + total)
  → placeOrderAtomic (tx)
  → automation.onOrderCreated
```

---

## Related Files

- `apps/api/src/application/automation/automation.service.ts`
- `apps/api/src/application/checkout/checkout.service.ts`
- `apps/api/src/infrastructure/persistence/drizzle/drizzle-checkout.repository.ts`
- `apps/api/src/application/inventory/inventory.service.ts`
- `apps/api/src/application/fulfillment/fulfillment.service.ts`
- `apps/api/src/application/shipping/shipping.service.ts`
