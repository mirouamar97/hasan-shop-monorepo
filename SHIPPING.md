# HASAN SHOP — Shipping & Carriers (M3)

**Last Updated**: 2026-07-10  
**Scope**: Carrier abstraction, Yalidine adapter, stub carriers, webhooks, quote/create/track/cancel  
**Package**: `@hasan-shop/carrier-adapters`

---

## Overview

M3 adds a carrier adapter layer decoupled from the API. Adapters implement the `CarrierAdapter` interface (`packages/shared/src/types/carrier.ts`). The API loads enabled carriers from `carrier_configs` at startup via `CarrierRegistryService`.

**Supported carrier slugs**: `yalidine`, `zr_express`, `ecotrack`, `noest` (`CARRIER_SLUGS` in `@hasan-shop/shared/constants`).

---

## Architecture

```
Admin API (ShippingController)
        ↓
ShippingService
        ↓
CarrierRegistryService → CarrierAdapterRegistry
        ↓
Carrier adapters (YalidineAdapter | StubCarrierAdapter)
        ↓
External carrier APIs (Yalidine only) or deterministic stubs
```

Shipment records and events are persisted via `DrizzleShipmentRepository` (`shipments`, `shipment_events` tables).

---

## Carrier Adapters

### Yalidine (production adapter)

**File**: `packages/carrier-adapters/src/yalidine/index.ts`

| Method | Yalidine API |
|--------|--------------|
| `testConnection` | `GET /wilayas/` |
| `calculateRate` | `GET /fees/?from_wilaya_id&to_wilaya_id&to_commune_id` |
| `createShipment` | `POST /parcels/` |
| `getTracking` | `GET /parcels/:tracking/history` |

**Configuration** (from `carrier_configs.credentials`):
- `apiId` — `X-API-ID` header
- `apiToken` — `X-API-TOKEN` header
- `apiUrl` — optional, defaults to `https://api.yalidine.app/v1`
- `originWilayaCode` — sender wilaya (default `16`)

Yalidine is only registered when **both** `apiId` and `apiToken` are present (`CarrierRegistryService.buildAdapterConfig`).

**Parcel payload highlights**:
- COD amount as `price`
- `freeshipping` flag from order
- `is_stopdesk` / `stopdesk_id` for stop-desk delivery
- Insurance enabled when `declaredValue > 10000`

Yalidine does **not** implement `cancelShipment` or `verifyWebhookSignature` in the current codebase.

### Stub carriers (ZR Express, Ecotrack, Noest)

**File**: `packages/carrier-adapters/src/stub-adapter.ts`

Deterministic adapters for development and carriers without live API integration yet.

| Behavior | Value |
|----------|-------|
| Home delivery rate | 600 DZD |
| Stop-desk rate | 400 DZD |
| Same-wilaya ETA | 2 days |
| Cross-wilaya ETA | 4 days |
| Tracking number | `{SLUG_PREFIX}{timestamp}` |
| `cancelShipment` | No-op |
| `testConnection` | Always `true` |

Stubs are always registered when the carrier is enabled in `carrier_configs`.

---

## Admin API Endpoints

**Base**: `/api/v1/admin/shipping`  
**Auth**: `AuthGuard` + RBAC + CSRF on mutations (except where noted)

| Method | Path | Permission | CSRF | Description |
|--------|------|------------|------|-------------|
| `GET` | `/quote` | `shipping:read` | — | Rate quote via carrier adapter |
| `POST` | `/orders/:orderId/shipment` | `shipping:write` | ✓ | Create shipment for order |
| `GET` | `/shipments/:id` | `shipping:read` | — | Get shipment by ID |
| `GET` | `/shipments/:id/track` | `shipping:read` | **Skipped** | Live + stored tracking events |
| `POST` | `/shipments/:id/cancel` | `shipping:write` | ✓ | Cancel shipment |
| `GET` | `/carriers` | `shipping:read` | — | List enabled carrier configs |

### Quote query parameters

| Param | Required | Description |
|-------|----------|-------------|
| `wilayaCode` | ✓ | Destination wilaya |
| `communeCode` | ✓ | Destination commune |
| `deliveryType` | ✓ | `home` or `stop_desk` |
| `subtotal` | ✓ | Order subtotal (DZD) |
| `weightKg` | — | Defaults to `1` |
| `codAmount` | — | Defaults to `subtotal` |
| `carrier` | — | Defaults to configured default carrier |

### Create shipment body

```json
{
  "carrier": "yalidine",
  "weightKg": 1.5
}
```

**Preconditions**:
- Order status must be `ready_to_ship` or `preparing`
- No existing shipment for the order (`409 Conflict` if duplicate)
- Carrier must be enabled in `carrier_configs`

**On success**: Creates `shipments` row, adds `created` event, returns shipment record with `trackingNumber`, `labelUrl`, `carrierParcelId`.

---

## Webhooks

**Endpoint**: `POST /api/v1/webhooks/carriers/:slug`  
**Auth**: None (public)  
**CSRF**: Skipped (`@SkipCsrf`)

| Header | Purpose |
|--------|---------|
| `x-signature` | Optional HMAC/signature verification if adapter implements `verifyWebhookSignature` |

**Processing** (`ShippingService.handleWebhook`):
1. Validate carrier slug against `CARRIER_SLUGS`
2. Verify signature when provided and adapter supports it
3. Extract tracking number from `trackingNumber`, `tracking_number`, `tracking`, or `parcel_id`
4. Look up shipment by tracking number
5. Map carrier status → internal `ShipmentStatus`
6. Update shipment timestamps (`shippedAt`, `deliveredAt`)
7. Append `shipment_events` row with raw payload
8. Sync order status: `ready_to_ship` → `shipped` on transit; → `delivered` on delivery

**Status mapping** (`CARRIER_STATUS_MAP`):

| Carrier status | Internal status |
|----------------|-----------------|
| `created` | `created` |
| `picked_up` | `picked_up` |
| `in_transit` | `in_transit` |
| `out_for_delivery` | `out_for_delivery` |
| `delivered` | `delivered` |
| `refused` | `refused` |
| `returned` | `returned` |
| `cancelled` | `cancelled` |

Unknown statuses retain the current shipment status.

---

## Track & Cancel

### Track

`GET /api/v1/admin/shipping/shipments/:id/track` returns:
```json
{
  "success": true,
  "data": {
    "shipment": { /* ShipmentRecord */ },
    "events": [ /* stored shipment_events */ ],
    "liveEvents": [ /* adapter.getTracking() */ ]
  }
}
```

### Cancel

`POST /api/v1/admin/shipping/shipments/:id/cancel`:
- Calls `adapter.cancelShipment` when implemented
- Sets shipment status to `cancelled`
- Appends cancellation event
- Idempotent if already cancelled

---

## Checkout vs Admin Quotes

Two quote paths exist:

| Context | Service | Behavior |
|---------|---------|----------|
| **Storefront checkout** | `DrizzleShippingRepository` | Flat rates (600/400 DZD), free-shipping threshold from settings |
| **Admin shipping** | `ShippingService.quote` | Live carrier adapter rates (Yalidine API or stub pricing) |

Checkout does **not** call carrier adapters directly in M3.

---

## Automation

When order status changes to `ready_to_ship`, `AutomationService` attempts `createShipmentForOrder`. Failures are logged as warnings and do **not** block the status transition.

---

## Default Carrier Resolution

`ShippingService.resolveDefaultCarrier` reads `carrier_configs` where `is_default = true` and `is_enabled = true`. Returns `400` if none configured.

---

## Database

Migration `0003_m3_operations.sql` adds:
- `shipment_events_shipment_id_idx` on `shipment_events(shipment_id)`

Carrier credentials stored in `carrier_configs.credentials` (JSON). Treat as secrets — never log or expose in API responses.

---

## Related Files

- `packages/carrier-adapters/src/`
- `apps/api/src/application/shipping/shipping.service.ts`
- `apps/api/src/application/shipping/carrier-registry.service.ts`
- `apps/api/src/presentation/modules/shipping/shipping.controller.ts`
- `apps/api/src/infrastructure/persistence/drizzle/drizzle-shipment.repository.ts`
