# HASAN SHOP — Order Workflow & Business Rules (M2)

**Milestone**: Order Management & Checkout System  
**Last Updated**: 2026-07-10

This document defines every business rule governing carts, checkout, orders, shipping, notifications, and customer engagement for the Algerian COD market.

---

## 1. Shopping Cart

| Rule | Description |
|------|-------------|
| **Persistence** | Guest carts use `hasan_cart` HTTP-only cookie (30-day TTL). Customer carts link to `customer_id` when logged in. |
| **Merge** | On customer login, session cart merges into customer cart (higher quantity wins per line). |
| **Line uniqueness** | One line per `product_id` + `variant_id` combination per cart. |
| **Quantity** | Min 1, max 99 per line. |
| **Price snapshot** | `unit_price` captured at add-to-cart time; refreshed on quantity update validation. |
| **Stock** | Cannot add/update beyond available inventory when `track_inventory` is enabled. |
| **Product status** | Only `active` products may be added. |
| **Expiry** | Carts expire after 30 days of inactivity; expired carts are cleared on next access. |

---

## 2. Checkout (Algeria-Optimized)

### Required fields

| Field | Validation |
|-------|------------|
| First Name | 2–50 characters |
| Last Name | 2–50 characters |
| Phone | Algerian mobile: `0[5-7]XXXXXXXX` |
| Wilaya | Valid wilaya code from geo API |
| Commune | Valid commune for selected wilaya |
| Address | 5–500 characters |
| Landmark | Optional, max 200 characters |
| Delivery Type | `home` or `stop_desk` |
| Product Color/Variant | Via `variant_id` on cart line or buy-now payload |
| Quantity | 1–99 |
| Notes | Optional, max 500 characters |

### Delivery types

| Type | Arabic | Behavior |
|------|--------|----------|
| `home` | توصيل للمنزل | Door delivery; full address required |
| `stop_desk` | مكتب التوصيل | Pickup at carrier office; `stop_desk_id` optional |

### Shipping cost calculation

1. Read default carrier from `carrier_configs` (fallback: local rate table).
2. **Home delivery**: 600 DZD default (configurable per wilaya in carrier settings).
3. **Stop desk**: 400 DZD default.
4. **Free shipping**: Applied when subtotal ≥ `free_shipping_threshold` store setting.
5. **Estimate**: 2 days same wilaya as origin; 4 days otherwise.
6. Yalidine API used when credentials configured; otherwise local fallback rates.

### Payment

- **Default**: Cash on Delivery (`cod`) — primary Algerian market method.
- COD must be enabled via `cod_enabled` store setting.
- Online methods reserved for future (`cib`, `edahabia`, `baridimob`).

### Guest checkout

- No account required.
- Optional `customer_id` when authenticated.
- Phone number is the primary customer identifier for tracking.

### Duplicate order prevention

| Mechanism | Rule |
|-----------|------|
| **Idempotency key** | `Idempotency-Key` header; same key returns existing order |
| **Time window** | Reject if same phone + total within **5 minutes** (HTTP 409) |
| **Inventory** | Stock decremented atomically on order creation |

---

## 3. Buy Now

- Skips cart; creates single-line order directly.
- Same checkout validation and duplicate prevention as cart checkout.
- Useful for mobile-first COD impulse purchases.

---

## 4. Order Lifecycle

### Status flow (happy path)

```
pending → confirmed → preparing → ready_to_ship → shipped → delivered → completed
```

### Additional terminal / exception states

| Status | Arabic | When |
|--------|--------|------|
| `cancelled` | ملغى | Customer or operator cancels before shipment |
| `customer_refused` | رفض العميل | Customer refuses at delivery |
| `returned` | مرتجع | Product returned after delivery |
| `failed_delivery` | فشل التسليم | Carrier could not deliver |
| `refunded` | مسترد | COD refund processed |

### Valid transitions

Enforced by `order-state-machine.ts` — invalid transitions throw `InvalidOrderTransitionError`.

| From | Allowed to |
|------|------------|
| pending | confirmed, cancelled |
| confirmed | preparing, cancelled |
| preparing | ready_to_ship, cancelled |
| ready_to_ship | shipped, cancelled |
| shipped | delivered, failed_delivery, cancelled |
| delivered | completed, returned, customer_refused |
| completed | returned, refunded |
| cancelled | *(terminal)* |
| customer_refused | returned, refunded |
| returned | refunded |
| failed_delivery | shipped, returned, cancelled, refunded |
| refunded | *(terminal)* |

### Timestamps

| Field | Set when status becomes |
|-------|-------------------------|
| `confirmed_at` | confirmed |
| `shipped_at` | shipped |
| `delivered_at` | delivered |
| `completed_at` | completed |
| `cancelled_at` | cancelled |

### Audit trail

Every status change writes to `order_status_history` with:
- `from_status`, `to_status`
- `actor_id` (admin user UUID)
- `note` (optional)
- `created_at`

### Operator assignment

- `assigned_operator_id` links order to admin user for fulfillment ownership.
- Logged via audit on assignment change.

---

## 5. Order Tracking (Public)

Customers track orders at `/[locale]/track` using:

| Input | Validation |
|-------|------------|
| Order Number | Format `HS-YYYYMMDD-XXXX` |
| Phone | Must match `shipping_phone` on order |

**Returns**: current status, timeline, items, shipping address (masked landmark), delivery estimate.  
**Does not return**: internal notes, cost prices, operator details.

---

## 6. Customer Engagement

| Feature | Storage | Rules |
|---------|---------|-------|
| **Favorites** | DB (`wishlists`) for customers; Redis for guests | Max deduped by product |
| **Recently viewed** | `recently_viewed` table | Last 12 products per session/customer |
| **Related products** | Computed | Same category, exclude current, max 8 |
| **Recommended** | Computed | Recently viewed first, then featured products |

---

## 7. Notifications

### Channels

| Channel | Provider | Config |
|---------|----------|--------|
| Email | Resend API | `RESEND_API_KEY`, `EMAIL_FROM` |
| WhatsApp | Webhook | `WHATSAPP_WEBHOOK_URL` or store setting |
| SMS | Future | `SMS_API_KEY` |

### Automatic triggers

| Event | Templates |
|-------|-----------|
| Order created | `order_created_email`, `order_created_whatsapp` |
| Order confirmed | `order_confirmed_whatsapp` |
| Order shipped | `order_shipped_whatsapp` |
| Order delivered | `order_delivered_email` |
| Order cancelled | `order_cancelled_whatsapp` (if template active) |

### Template variables

`{{orderNumber}}`, `{{firstName}}`, `{{lastName}}`, `{{total}}`, `{{status}}`, `{{deliveryEstimate}}`, `{{phone}}`

Templates editable via Admin → Settings → Notification Templates (`PUT /api/v1/admin/notification-templates/:slug`).

All sends logged in `notification_logs`.

---

## 8. Admin Order Management

| Capability | Permission |
|------------|------------|
| View orders | `orders:read` |
| Update status, assign operator, notes | `orders:write` |
| Export CSV/Excel | `orders:export` |
| Confirmation calls | `orders:confirm` |

### Filters

Status, search (order number / phone / name), wilaya, assigned operator, date range.

### Bulk actions

Bulk status update with state machine validation per order.

### Print

- **Invoice** (`/admin/orders/:id/invoice`) — customer-facing HTML with line items and totals.
- **Packing slip** (`/admin/orders/:id/packing-slip`) — warehouse pick list with COD amount.

---

## 9. Architecture

```
Presentation (Controllers)
    ↓
Application (CartService, CheckoutService, OrdersService, …)
    ↓
Domain (Repositories interfaces, OrderStateMachine)
    ↓
Infrastructure (Drizzle repositories, Resend, Redis, Yalidine)
```

Business rules live in application + domain layers. Infrastructure has no business logic.

---

## 10. Algerian Market Optimizations

1. **Phone-first identity** — no email required for COD.
2. **Wilaya/commune** — full Algeria geo dataset (58 wilayas).
3. **COD default** — matches local e-commerce behavior.
4. **Stop desk** — supports Yalidine office pickup pattern.
5. **Arabic-first** — UI, notifications, and invoice RTL.
6. **Duplicate protection** — reduces accidental double-tap orders on mobile.
7. **WhatsApp notifications** — primary post-purchase channel in Algeria.
8. **Simple checkout** — minimal fields, no postal codes (not used in DZ).

---

## 11. Future Enhancements (Post-M2)

- Carrier parcel creation via Yalidine API on `ready_to_ship`
- SMS confirmation for order status
- Customer accounts with order history
- Coupon/discount application at checkout
- Multi-item weight-based shipping tiers
