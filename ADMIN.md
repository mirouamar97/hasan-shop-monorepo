# Admin Dashboard

**Application**: `apps/admin`  
**URL (dev)**: http://localhost:3001  
**Framework**: Next.js 15, React 19, Tailwind CSS 4  
**Auth**: Session cookie via API (`hasan_session`)

---

## Overview

The HASAN SHOP admin dashboard is the internal operations console for managing catalog, orders, shipping, customers, analytics, and store configuration. It is **not** customer-facing and requires authenticated admin users with appropriate RBAC permissions.

Design principles:

- **Task-oriented navigation** — agents live in order queues; catalog managers in product lists
- **Permission-gated UI** — routes and actions hidden or disabled without required permission
- **Bilingual admin chrome** — French-primary for admin UI; data displays customer locale where relevant
- **Mobile-capable** — fulfillment agents may confirm orders from phone browsers

---

## Authentication Flow

1. User visits `/login`
2. Submits email, password, and optional TOTP code
3. API validates credentials → sets HTTP-only `hasan_session` cookie
4. Admin app redirects to `/dashboard`
5. `GET /api/v1/auth/me` loads user profile and permissions on each session
6. Logout calls `POST /api/v1/auth/logout` and clears cookie

### Session Security

- Cookie: `httpOnly`, `secure` in production, `sameSite: strict`
- Session expiry: configurable via `AUTH_SESSION_EXPIRY_HOURS` (default 168h / 7 days)
- Inactive sessions cleaned from `sessions` table on expiry

### Two-Factor Authentication (2FA)

- TOTP via authenticator app (Google Authenticator, Authy)
- Enabled per user in profile settings
- Issuer name: `HASAN SHOP` (`AUTH_2FA_ISSUER`)
- Backup codes generated on enable (store securely)

---

## Role-Based Access Control (RBAC)

Permissions are defined in `packages/shared/src/permissions/index.ts` and stored as JSON arrays on `roles.permissions`.

### Permission Matrix

| Permission | Description |
|------------|-------------|
| `catalog:read` | View products, categories, brands |
| `catalog:write` | Create and update catalog items |
| `catalog:delete` | Delete/archive catalog items |
| `catalog:import` | Bulk CSV import |
| `orders:read` | View orders |
| `orders:write` | Update order status and details |
| `orders:confirm` | Log confirmation calls |
| `orders:cancel` | Cancel orders |
| `orders:export` | Export order CSV |
| `customers:read` | View customer profiles |
| `customers:write` | Update customer information |
| `shipping:read` | View shipments and tracking |
| `shipping:write` | Create shipments, print labels |
| `shipping:configure` | Carrier API credentials |
| `payments:read` | View payment records |
| `payments:write` | Refunds and COD reconciliation |
| `suppliers:read` | View suppliers |
| `suppliers:write` | Manage suppliers |
| `analytics:read` | Reports and dashboards |
| `settings:read` | View store settings |
| `settings:write` | Update branding and configuration |
| `users:read` | View admin users |
| `users:write` | Create/update admin users |
| `users:delete` | Deactivate admin users |
| `roles:manage` | Manage roles and permissions |
| `audit:read` | View audit logs |
| `system:manage` | Full system administration |

### Default Roles

| Role Slug | Name | Typical User |
|-----------|------|--------------|
| `super_admin` | Super Admin | Store owner, lead developer |
| `catalog_manager` | Catalog Manager | Product listing team |
| `fulfillment_agent` | Fulfillment Agent | Warehouse/shipping staff |
| `support_agent` | Support Agent | Customer service, confirmations |
| `analyst` | Analyst | Reporting, read-only oversight |

### Enforcement

- **API**: `@Permissions('orders:read')` decorator + `AuthGuard` on controllers
- **UI**: `<Can permission="orders:write">` wrapper components; unauthorized routes redirect to `/403`
- **Principle of least privilege**: New staff get minimal role; escalate as needed

---

## Dashboard Modules

### 1. Dashboard Home (`/dashboard`)

**Permission**: Any authenticated user (widgets filtered by permission)

**Widgets**:

- Orders today / this week
- Revenue (confirmed + delivered COD)
- Pending confirmations count (clickable → queue)
- Low stock alerts (`inventory.quantity ≤ low_stock_threshold`)
- Recent orders table (last 10)
- Confirmation rate (7-day rolling)

---

### 2. Orders (`/dashboard/orders`)

**Permissions**: `orders:read` (view), `orders:write`, `orders:confirm`, `orders:cancel`

#### Order List

- Filters: status, date range, wilaya, payment method, carrier
- Bulk actions: export CSV (`orders:export`), assign to agent
- Status badges with color coding per `order_status` enum
- Quick search by order number, phone, customer name

#### Order Detail (`/dashboard/orders/:id`)

Sections:

1. **Header** — Order number, status, created date, action buttons
2. **Customer** — Name, phone (click-to-call), email, link to customer profile
3. **Shipping** — Full address snapshot, wilaya/commune, delivery type, landmark
4. **Line Items** — SKU, name, variant, qty, unit price, supplier
5. **Totals** — Subtotal, shipping, discount, total, payment method
6. **Confirmation Log** — Timeline of confirmation attempts with agent, method, outcome
7. **Status History** — Audit trail with actor and notes
8. **Shipment** — Tracking number, label download, event timeline
9. **Internal Notes** — Staff-only notes field
10. **Payments** — COD status, reconciliation link

#### Actions

| Action | Permission | Description |
|--------|------------|-------------|
| Change status | `orders:write` | Dropdown with valid transitions |
| Log confirmation | `orders:confirm` | Modal: method, outcome, notes |
| Create shipment | `shipping:write` | Opens Yalidine parcel form |
| Print label | `shipping:write` | Opens label PDF |
| Cancel order | `orders:cancel` | Requires reason |

#### Confirmation Queue (`/dashboard/orders/confirmations`)

Filtered view: `status IN (pending, awaiting_confirmation)`  
Sorted by `created_at ASC` (FIFO)  
Optimized for support agents — one-click phone log

---

### 3. Catalog (`/dashboard/catalog`)

**Permissions**: `catalog:*`

#### Products (`/dashboard/catalog/products`)

- Data table: image, name, SKU, price, status, stock, category
- Create/edit form:
  - Basic info: SKU, slug, status, category, brand, supplier
  - Pricing: price, compare-at, cost (margin calculator)
  - Translations: AR/FR tabs for name, description, SEO
  - Variants: attribute matrix generator
  - Images: drag-drop upload to S3, reorder, primary selection
  - Inventory: quantity, low stock threshold per variant
- Bulk actions: activate, archive, export

#### Categories (`/dashboard/catalog/categories`)

- Tree view with drag-drop reorder
- Parent category selector
- AR/FR translation fields

#### Brands (`/dashboard/catalog/brands`)

- Simple CRUD with logo upload

#### Import (`/dashboard/catalog/import`)

**Permission**: `catalog:import`  
CSV template download, upload, validation preview, import report

---

### 4. Customers (`/dashboard/customers`)

**Permissions**: `customers:read`, `customers:write`

- Customer list with order count, total spent, locale
- Profile: contact info, addresses, order history, reviews
- Edit contact details (not order snapshots)

---

### 5. Shipping (`/dashboard/shipping`)

**Permissions**: `shipping:read`, `shipping:write`, `shipping:configure`

#### Shipments List

- Filter by carrier, status, date
- Tracking number search

#### Carrier Settings (`/dashboard/shipping/carriers`)

**Permission**: `shipping:configure`  
- Enable/disable carriers
- Set default carrier
- Yalidine API ID and token (masked)
- Origin wilaya (warehouse location)

---

### 6. Payments (`/dashboard/payments`)

**Permissions**: `payments:read`, `payments:write`

- Payment list by order
- COD reconciliation board: pending / received / disputed
- Mark received with actual amount and commission
- Dispute workflow with notes

---

### 7. Suppliers (`/dashboard/suppliers`)

**Permissions**: `suppliers:read`, `suppliers:write`

- Supplier directory: local vs international
- Contact info, wilaya, linked products count
- Metadata for international: country, lead time days

---

### 8. Analytics (`/dashboard/analytics`)

**Permission**: `analytics:read`

Reports:

- Revenue over time (line chart)
- Orders by wilaya (map/bar)
- Top products by revenue and units
- Confirmation rate trend
- Refusal/return rate
- Average order value

Export: CSV download on all reports

---

### 9. Settings (`/dashboard/settings`)

**Permissions**: `settings:read`, `settings:write`

Tabs:

| Tab | Contents |
|-----|----------|
| General | Store name, tagline, logo, favicon |
| Contact | Email, phone, WhatsApp, address |
| Social | Facebook, Instagram, TikTok, Twitter URLs |
| Branding | Primary, secondary, accent colors (live preview) |
| SEO | Default meta title/description/keywords per locale |
| Shipping | Free shipping threshold, default carrier |
| Payments | COD toggle, online payment toggle (feature flag) |
| Features | Feature flag toggles |
| Notifications | Email templates preview (future) |

---

### 10. Users & Roles (`/dashboard/users`)

**Permissions**: `users:*`, `roles:manage`

- User list: name, email, role, status, last login
- Create user: email, name, role assignment, temp password
- Enable/disable 2FA
- Suspend user (`status: suspended`)
- Role editor: permission checklist (super_admin only)

---

### 11. Audit Log (`/dashboard/audit`)

**Permission**: `audit:read`

- Filterable log: user, action, entity type, date range
- Expandable row shows JSON diff (`changes` field)
- Request ID links to API logs

---

## UI Patterns

### Status Colors (Orders)

| Status | Color |
|--------|-------|
| pending, awaiting_confirmation | Amber |
| confirmed, processing | Blue |
| shipped, out_for_delivery | Indigo |
| delivered, paid | Green |
| refused, returned, cancelled | Red |

### Notifications

- Toast notifications for save success/failure
- Real-time optional (WebSocket/SSE) for new orders in M4+

### Keyboard Shortcuts (Planned)

- `G then O` — Go to orders
- `G then P` — Go to products
- `/` — Focus search

---

## Error States

| State | Behavior |
|-------|----------|
| 401 Unauthorized | Redirect to `/login` |
| 403 Forbidden | Static forbidden page with required permission shown |
| 404 Not Found | Order/product not found message |
| API offline | Banner with retry; cached data where safe |

---

## Development

```bash
pnpm --filter @hasan-shop/admin dev
```

Admin consumes API at `API_URL` from environment. CORS allows `ADMIN_URL` origin with credentials.

---

## Related Documents

- [API.md](./API.md) — Endpoint reference
- [SECURITY.md](./SECURITY.md) — Auth and CSRF details
- [UI_UX.md](./UI_UX.md) — Design system
