# Database Schema Reference

**Engine**: PostgreSQL 16  
**ORM**: Drizzle ORM  
**Schema location**: `packages/database/src/schema/index.ts`

---

## Overview

The HASAN SHOP database is organized into logical domains:

1. **Users & Auth** — Admin users, roles, sessions
2. **Customers** — Shopper profiles and addresses
3. **Geography** — Algeria wilayas and communes
4. **Catalog** — Products, categories, brands, suppliers, inventory
5. **Cart & Orders** — Shopping carts, orders, confirmations
6. **Shipping** — Carrier configs, shipments, tracking events
7. **Payments** — Payment records, COD reconciliation
8. **Engagement** — Reviews, wishlists
9. **System** — Store settings, feature flags, audit logs

All primary keys are UUIDs unless noted. Timestamps use `timestamptz`. Monetary values use `decimal(12,2)` in DZD.

---

## Entity Relationship Diagram

```
roles ──< users ──< sessions
                └──< audit_logs

customers ──< customer_addresses
          ──< orders ──< order_items
          │         ──< order_status_history
          │         ──< order_confirmations
          │         ──< shipments ──< shipment_events
          │         ──< payments
          │         └──< cod_reconciliations
          ──< reviews
          └──< wishlists

wilayas ──< communes

categories ──< category_translations
           ──< products ──< product_translations
                      ──< product_variants
                      ──< product_images
                      └──< inventory

brands ──< products
suppliers ──< products

carts ──< cart_items
coupons ──< orders (optional)

carrier_configs (standalone)
store_settings (key-value)
feature_flags (key-value)
```

---

## Enums

| Enum | Values |
|------|--------|
| `user_status` | `active`, `inactive`, `suspended` |
| `order_status` | `pending`, `awaiting_confirmation`, `confirmed`, `processing`, `shipped`, `out_for_delivery`, `delivered`, `paid`, `refused`, `returned`, `cancelled` |
| `payment_method` | `cod`, `cib`, `edahabia`, `baridimob` |
| `payment_status` | `pending`, `authorized`, `captured`, `failed`, `refunded`, `cancelled` |
| `product_status` | `draft`, `active`, `archived` |
| `supplier_type` | `local`, `international` |
| `delivery_type` | `home`, `stop_desk` |
| `carrier_slug` | `yalidine`, `zr_express`, `ecotrack`, `noest` |
| `confirmation_method` | `phone`, `whatsapp`, `sms`, `email` |
| `confirmation_outcome` | `confirmed`, `no_answer`, `wrong_number`, `cancelled_by_customer`, `rescheduled` |
| `shipment_status` | `created`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `refused`, `returned`, `cancelled` |
| `audit_action` | `create`, `update`, `delete`, `login`, `logout`, `export`, `status_change` |

---

## Users & Auth

### `roles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `slug` | varchar(50) UNIQUE | e.g. `super_admin`, `catalog_manager` |
| `name` | varchar(100) | Display name |
| `description` | text | |
| `permissions` | jsonb | Array of permission strings |
| `created_at`, `updated_at` | timestamptz | |

**Seeded roles**: `super_admin`, `catalog_manager`, `fulfillment_agent`, `support_agent`, `analyst`

### `users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `email` | varchar(255) UNIQUE | Login identifier |
| `password_hash` | varchar(255) | bcrypt hash |
| `first_name`, `last_name` | varchar(50) | |
| `phone` | varchar(15) | Optional |
| `role_id` | UUID FK → roles | |
| `status` | user_status | Default `active` |
| `totp_secret` | varchar(255) | Encrypted TOTP secret |
| `totp_enabled` | boolean | Default false |
| `last_login_at` | timestamptz | |

**Indexes**: `role_id`, `status`

### `sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | CASCADE delete |
| `token` | varchar(255) UNIQUE | Session token (cookie value) |
| `expires_at` | timestamptz | |
| `ip_address` | varchar(45) | |
| `user_agent` | text | |

---

## Customers

### `customers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `email` | varchar(255) | Optional |
| `phone` | varchar(15) UNIQUE | Primary identifier |
| `password_hash` | varchar(255) | Nullable for guest-only |
| `first_name`, `last_name` | varchar(50) | |
| `locale` | varchar(5) | Default `ar` |
| `email_verified`, `phone_verified` | boolean | |

### `customer_addresses`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `customer_id` | UUID FK | |
| `label` | varchar(50) | e.g. "Home", "Work" |
| `first_name`, `last_name`, `phone` | | Delivery contact |
| `wilaya_code`, `wilaya_name` | | Algerian province |
| `commune_code`, `commune_name` | | Municipality |
| `address` | text | Street address |
| `landmark` | varchar(200) | Delivery landmark |
| `delivery_type` | delivery_type | `home` or `stop_desk` |
| `stop_desk_id` | varchar(50) | Carrier stop desk ID |
| `is_default` | boolean | |

---

## Geography

### `wilayas`

| Column | Type | Description |
|--------|------|-------------|
| `code` | varchar(3) PK | Official wilaya code (01–58) |
| `name_ar`, `name_fr`, `name_en` | varchar(100) | Localized names |
| `region` | varchar(50) | Geographic region |
| `latitude`, `longitude` | decimal | Centroid coordinates |

### `communes`

| Column | Type | Description |
|--------|------|-------------|
| `code` | varchar(6) PK | Commune code |
| `wilaya_code` | varchar(3) FK → wilayas | |
| `name_ar`, `name_fr`, `name_en` | varchar(100) | |
| `postal_code` | varchar(10) | |
| `daira_ar`, `daira_fr` | varchar(100) | District names |

**Seed**: `pnpm db:seed` loads all 58 wilayas and communes via `seed-geo.ts`.

---

## Catalog

### `categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `slug` | varchar(200) UNIQUE | URL slug |
| `parent_id` | UUID | Self-reference for hierarchy |
| `sort_order` | integer | Display order |
| `image_url` | varchar(500) | |
| `is_active` | boolean | |

### `category_translations`

Composite PK: (`category_id`, `locale`) — `name`, `description`, `meta_title`, `meta_description`

### `brands`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `slug`, `name` | | |
| `logo_url` | varchar(500) | |
| `is_active` | boolean | |

### `suppliers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `name`, `slug` | | |
| `type` | supplier_type | `local` or `international` |
| `contact_name`, `contact_phone`, `contact_email` | | |
| `address`, `wilaya_code` | | |
| `metadata` | jsonb | Lead time, country, customs info |

### `products`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `sku`, `slug` | UNIQUE | |
| `status` | product_status | |
| `category_id`, `brand_id`, `supplier_id` | UUID FK | Nullable |
| `price`, `compare_at_price`, `cost_price` | decimal | DZD |
| `weight_kg` | decimal | For shipping calculation |
| `is_featured` | boolean | |
| `track_inventory` | boolean | |

### `product_translations`

Composite PK: (`product_id`, `locale`) — `name`, `description`, `short_description`, SEO fields

### `product_variants`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `product_id` | UUID FK | CASCADE delete |
| `sku` | UNIQUE | Variant SKU |
| `name` | varchar(200) | e.g. "Red / XL" |
| `price`, `compare_at_price` | decimal | Override product price |
| `attributes` | jsonb | `{"color": "red", "size": "XL"}` |
| `is_active` | boolean | |

### `product_images`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `product_id` | UUID FK | |
| `url` | varchar(500) | S3/CDN URL |
| `alt_text` | varchar(200) | |
| `sort_order` | integer | |
| `is_primary` | boolean | |

### `inventory`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `product_id` | UUID FK | |
| `variant_id` | UUID FK | Nullable for simple products |
| `quantity` | integer | Available stock |
| `reserved_quantity` | integer | Reserved by open carts/orders |
| `low_stock_threshold` | integer | Default 5 |

**Unique**: (`product_id`, `variant_id`)

---

## Cart & Orders

### `carts` / `cart_items`

Guest carts use `session_token`; registered customers use `customer_id`. Cart items snapshot `unit_price` at add time.

### `coupons`

| Column | Type | Description |
|--------|------|-------------|
| `code` | varchar(50) UNIQUE | |
| `discount_type` | varchar(20) | `percentage` or `fixed` |
| `discount_value` | decimal | |
| `min_order_amount` | decimal | Optional minimum |
| `max_uses`, `used_count` | integer | Usage limits |
| `starts_at`, `expires_at` | timestamptz | Validity window |
| `is_active` | boolean | |

### `orders`

Core order record with **denormalized shipping address snapshot** (immutable after placement).

| Column | Type | Notes |
|--------|------|-------|
| `order_number` | varchar(20) UNIQUE | Human-readable, e.g. `HS-20260709-0042` |
| `status` | order_status | See lifecycle in PROJECT.md |
| `payment_method`, `payment_status` | enums | |
| `subtotal`, `shipping_cost`, `discount_amount`, `total` | decimal | |
| `coupon_id`, `coupon_code` | | Applied coupon snapshot |
| `shipping_*` | various | Full address snapshot fields |
| `confirmed_at`, `shipped_at`, `delivered_at`, `paid_at`, `cancelled_at` | timestamptz | Milestone timestamps |

### `order_items`

Line items with product snapshot: `sku`, `name`, `variant_name`, `quantity`, `unit_price`, `total_price`, `cost_price`, `supplier_id`.

### `order_status_history`

Audit of every status change: `from_status`, `to_status`, `note`, `actor_id` (admin user).

### `order_confirmations`

Confirmation call log: `agent_id`, `method`, `outcome`, `notes`, `attempted_at`.

---

## Shipping

### `carrier_configs`

| Column | Type | Description |
|--------|------|-------------|
| `carrier` | carrier_slug UNIQUE | |
| `display_name` | varchar(100) | |
| `is_enabled`, `is_default` | boolean | |
| `credentials` | jsonb | API keys (encrypt at rest) |
| `settings` | jsonb | Rate tables, defaults |
| `origin_wilaya_code` | varchar(3) | Warehouse wilaya |

### `shipments`

| Column | Type | Description |
|--------|------|-------------|
| `order_id` | UUID FK | |
| `carrier` | carrier_slug | |
| `tracking_number`, `carrier_parcel_id` | | From carrier API |
| `status` | shipment_status | |
| `label_url` | varchar(500) | PDF label |
| `cod_amount` | decimal | Amount carrier collects |
| `shipping_cost`, `weight_kg` | | |
| `metadata` | jsonb | Raw carrier response |

### `shipment_events`

Tracking timeline: `status`, `status_label`, `location`, `raw_payload`, `occurred_at`.

---

## Payments

### `payments`

Gateway transactions for online payments. COD orders may have a `payments` row with `method=cod` and `status=pending` until delivery.

### `cod_reconciliations`

Matches carrier remittance against expected COD: `expected_amount`, `received_amount`, `commission`, `status` (`pending` | `received` | `disputed`).

---

## Engagement

### `reviews`

One review per customer per product (`uniqueIndex` on `customer_id`, `product_id`). Requires `is_approved` before public display.

### `wishlists`

Customer product bookmarks with unique (`customer_id`, `product_id`).

---

## System Tables

### `store_settings`

Key-value configuration (store name, colors, contact, SEO, `cod_enabled`, `free_shipping_threshold`, etc.).

### `feature_flags`

Boolean toggles: `international_suppliers`, `online_payments`, `whatsapp_notifications`.

### `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID FK | Nullable for system actions |
| `action` | audit_action | |
| `entity_type`, `entity_id` | | What was affected |
| `changes` | jsonb | Before/after diff |
| `ip_address`, `user_agent`, `request_id` | | Request context |

---

## Migrations & Seeding

```bash
# After schema changes
pnpm db:generate
pnpm db:migrate

# Seed data
pnpm db:seed
```

**Seed includes**: RBAC roles, super admin user, store settings, feature flags, Yalidine carrier config placeholder, sample categories/brands/suppliers.

---

## Indexing Strategy

- Foreign keys indexed on all high-cardinality relationships
- `orders`: `status`, `created_at`, `order_number`, `customer_id`
- `products`: `status`, `category_id`, `brand_id`
- `audit_logs`: `created_at` for time-range queries
- `shipments`: `tracking_number` for lookup

---

## Conventions

- **Soft delete**: Use `status` enums (`archived`, `inactive`) rather than hard delete for catalog and users
- **Snapshots**: Order address and line items are immutable snapshots
- **Locales**: `ar` and `fr` supported; extend via translation tables
- **Currency**: Always DZD; `payments.currency` defaults to `DZD`
