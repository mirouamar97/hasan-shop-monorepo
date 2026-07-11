# REST API Reference (v1)

**Base URL**: `{API_URL}/api/v1`  
**Default (dev)**: `http://localhost:4000/api/v1`  
**Framework**: NestJS 11  
**Authentication**: HTTP-only session cookie (`hasan_session`) for admin; customer session token for storefront

---

## Conventions

### Response Envelope

All endpoints return a consistent JSON structure:

```json
{
  "success": true,
  "data": { }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (including login) |
| 201 | Resource created |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (missing permission) |
| 404 | Resource not found |
| 409 | Conflict (duplicate SKU, etc.) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Pagination

List endpoints accept query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `pageSize` | integer | 20 | Items per page (max 100) |
| `sortBy` | string | varies | Sort field |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

Paginated response `data`:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

### Headers

| Header | Description |
|--------|-------------|
| `X-Request-ID` | Correlation ID (returned on every response) |
| `X-CSRF-Token` | Required on state-changing admin requests |
| `Content-Type` | `application/json` |
| `Accept-Language` | `ar` or `fr` (optional, for localized errors) |

### Authentication

- **Admin**: `POST /auth/login` sets `hasan_session` cookie. Include cookie on subsequent requests.
- **Customer**: `hasan_customer` cookie or `Authorization: Bearer <token>` (future).
- **Public**: Catalog read, geo, health — no auth required.

---

## Health

### `GET /health`

Public. Returns service health status.

**Response 200**:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "timestamp": "2026-07-09T20:00:00.000Z",
    "services": {
      "database": "up",
      "redis": "up",
      "meilisearch": "up"
    }
  }
}
```

`status` is `degraded` if any non-critical service is down; `error` if database is down.

---

## Authentication (Admin)

### `POST /auth/login`

Authenticate admin user. Sets session cookie.

**Body**:

```json
{
  "email": "admin@hasan-shop.dz",
  "password": "********",
  "totpCode": "123456"
}
```

`totpCode` required only when user has 2FA enabled.

**Response 200**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@hasan-shop.dz",
      "firstName": "Admin",
      "lastName": "User",
      "role": { "slug": "super_admin", "name": "Super Admin" },
      "permissions": ["catalog:read", "..."]
    },
    "expiresAt": "2026-07-16T20:00:00.000Z"
  }
}
```

### `POST /auth/logout`

**Auth**: Required  
**Response 200**: Clears session cookie.

### `GET /auth/me`

**Auth**: Required  
Returns current authenticated admin user.

---

## Geography

### `GET /geo/wilayas`

Public. List all Algerian wilayas.

**Query**: `locale` — `ar` (default) or `fr`

**Response 200**:

```json
{
  "success": true,
  "data": [
    { "code": "16", "name": "الجزائر", "region": "north" }
  ]
}
```

### `GET /geo/wilayas/:code/communes`

Public. List communes for a wilaya.

**Params**: `code` — wilaya code (e.g. `16`)  
**Query**: `locale` — `ar` or `fr`

---

## Store Settings

### `GET /settings/public`

Public. Storefront-safe settings (name, logo, colors, contact, SEO, feature flags).

**Response 200**:

```json
{
  "success": true,
  "data": {
    "storeName": "HASAN SHOP",
    "primaryColor": "#1a56db",
    "defaultLocale": "ar",
    "codEnabled": true,
    "freeShippingThreshold": 10000
  }
}
```

### `GET /settings`

**Auth**: `settings:read`  
Full settings including internal values.

### `PATCH /settings`

**Auth**: `settings:write`  
Update store settings (key-value pairs).

---

## Products (Catalog)

### `GET /products`

Public. List active products.

**Query**: `page`, `pageSize`, `category`, `brand`, `featured`, `q` (search), `locale`

### `GET /products/:slug`

Public. Product detail by slug.

### `POST /products`

**Auth**: `catalog:write`  
Create product with translations and optional variants.

**Body** (abbreviated):

```json
{
  "sku": "HS-TSHIRT-001",
  "slug": "cotton-tshirt",
  "status": "draft",
  "categoryId": "uuid",
  "brandId": "uuid",
  "supplierId": "uuid",
  "price": "2500.00",
  "compareAtPrice": "3200.00",
  "costPrice": "1200.00",
  "weightKg": "0.350",
  "translations": [
    { "locale": "ar", "name": "تيشيرت قطني", "description": "..." },
    { "locale": "fr", "name": "T-shirt coton", "description": "..." }
  ],
  "variants": [
    { "sku": "HS-TSHIRT-001-RED-M", "name": "أحمر / M", "attributes": { "color": "red", "size": "M" } }
  ]
}
```

### `PATCH /products/:id`

**Auth**: `catalog:write`

### `DELETE /products/:id`

**Auth**: `catalog:delete`  
Soft-archives product (`status: archived`).

### `POST /products/import`

**Auth**: `catalog:import`  
Bulk CSV import.

---

## Categories & Brands

### `GET /categories`

Public. Category tree with translations.

### `POST /categories` / `PATCH /categories/:id` / `DELETE /categories/:id`

**Auth**: `catalog:write` / `catalog:delete`

### `GET /brands` / `POST /brands` / `PATCH /brands/:id`

**Auth**: Read public; write requires `catalog:write`

---

## Search

### `GET /search`

Public. Meilisearch-powered product search.

**Query**: `q`, `locale`, `page`, `pageSize`, `filters` (category, brand, price range)

**Response 200**:

```json
{
  "success": true,
  "data": {
    "hits": [],
    "query": "تيشيرت",
    "processingTimeMs": 12,
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 45 }
  }
}
```

---

## Cart

### `GET /cart`

**Auth**: Customer session or guest session cookie.

### `POST /cart/items`

Add item to cart.

**Body**:

```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 2
}
```

### `PATCH /cart/items/:id`

Update quantity.

### `DELETE /cart/items/:id`

Remove item.

### `POST /cart/coupon`

Apply coupon code.

**Body**: `{ "code": "WELCOME10" }`

---

## Checkout & Orders

### `POST /checkout/shipping-quote`

Calculate shipping for cart contents and destination.

**Body**:

```json
{
  "wilayaCode": "16",
  "communeCode": "16001",
  "deliveryType": "home"
}
```

**Response**: `{ "shippingCost": "600.00", "carrier": "yalidine", "estimatedDays": "2-4" }`

### `POST /checkout`

Place order (COD default).

**Body**:

```json
{
  "paymentMethod": "cod",
  "shipping": {
    "firstName": "أحمد",
    "lastName": "بن علي",
    "phone": "0555123456",
    "wilayaCode": "16",
    "communeCode": "16001",
    "address": "حي بن عكنون، شارع ...",
    "landmark": "مقابل المسجد",
    "deliveryType": "home"
  },
  "customerNotes": "اتصلوا قبل التوصيل",
  "locale": "ar"
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "HS-20260709-0042",
    "status": "pending",
    "total": "5600.00"
  }
}
```

### `GET /orders/:orderNumber/track`

Public (with phone verification). Order tracking for customers.

**Query**: `phone` — last 4 digits or full phone for verification

### `GET /orders`

**Auth**: `orders:read` (admin) or customer session (own orders)

### `GET /orders/:id`

**Auth**: `orders:read`

### `PATCH /orders/:id/status`

**Auth**: `orders:write`

**Body**:

```json
{
  "status": "confirmed",
  "note": "Customer confirmed via phone"
}
```

### `POST /orders/:id/confirmations`

**Auth**: `orders:confirm`

**Body**:

```json
{
  "method": "phone",
  "outcome": "confirmed",
  "notes": "Will receive tomorrow"
}
```

---

## Customers (Admin)

### `GET /customers`

**Auth**: `customers:read`

### `GET /customers/:id`

**Auth**: `customers:read`

### `PATCH /customers/:id`

**Auth**: `customers:write`

---

## Shipping

### `POST /orders/:id/shipments`

**Auth**: `shipping:write`  
Create carrier shipment (Yalidine).

**Response 201**:

```json
{
  "success": true,
  "data": {
    "shipmentId": "uuid",
    "trackingNumber": "YLD123456789",
    "labelUrl": "https://...",
    "status": "created"
  }
}
```

### `GET /shipments/:id`

**Auth**: `shipping:read`

### `GET /shipments/:id/events`

**Auth**: `shipping:read`  
Tracking event timeline.

### `POST /webhooks/yalidine`

Public (signature verified). Carrier status webhook.

---

## Payments

### `GET /orders/:id/payments`

**Auth**: `payments:read`

### `POST /payments/:id/reconcile`

**Auth**: `payments:write`  
COD reconciliation update.

---

## Suppliers

### `GET /suppliers` / `POST /suppliers` / `PATCH /suppliers/:id`

**Auth**: `suppliers:read` / `suppliers:write`

---

## Analytics

### `GET /analytics/dashboard`

**Auth**: `analytics:read`

**Response**:

```json
{
  "success": true,
  "data": {
    "ordersToday": 24,
    "revenueToday": 156000,
    "pendingConfirmations": 8,
    "confirmationRate": 0.78,
    "topProducts": []
  }
}
```

### `GET /analytics/reports/orders`

**Auth**: `analytics:read`  
**Query**: `from`, `to`, `groupBy` (day, wilaya, product)

---

## Users & Roles (Admin)

### `GET /users` / `POST /users` / `PATCH /users/:id`

**Auth**: `users:read` / `users:write`

### `GET /roles` / `PATCH /roles/:id`

**Auth**: `roles:manage`

---

## Audit Logs

### `GET /audit-logs`

**Auth**: `audit:read`  
**Query**: `page`, `pageSize`, `userId`, `entityType`, `action`, `from`, `to`

---

## Rate Limits

| Endpoint group | Limit |
|----------------|-------|
| `POST /auth/login` | 5 requests / 15 min / IP |
| `POST /checkout` | 10 requests / hour / IP |
| `GET /search` | 60 requests / min / IP |
| General API | 300 requests / min / IP |

Exceeded limits return `429` with `Retry-After` header.

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request body/query failed validation |
| `UNAUTHORIZED` | Missing or invalid session |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource does not exist |
| `CONFLICT` | Duplicate or state conflict |
| `INSUFFICIENT_STOCK` | Inventory check failed |
| `COUPON_INVALID` | Coupon expired, used, or inapplicable |
| `CARRIER_ERROR` | External shipping API failure |
| `RATE_LIMITED` | Too many requests |

---

## OpenAPI

Swagger/OpenAPI 3.1 spec generation is planned for M3. Until then, this document is the authoritative v1 contract. Implemented endpoints today: `/health`, `/auth/*`, `/geo/*`, `/settings/*`.
