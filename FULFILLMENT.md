# HASAN SHOP — Fulfillment Workflow (M3)

**Last Updated**: 2026-07-10  
**Scope**: Warehouse fulfillment stages, admin API, barcode/QR data  
**Base URL**: `/api/v1/admin/fulfillment`

---

## Overview

M3 introduces a four-stage warehouse workflow for orders. Each order gets one task per stage. Tasks track assignment, timing, notes, and machine-readable identifiers generated when a stage is completed.

Fulfillment is initialized automatically when an order transitions to `confirmed` (via `AutomationService`). Completing the final stage can promote the order from `preparing` to `ready_to_ship` when all stages are done or skipped.

---

## Workflow Stages

| Stage | Slug | Purpose |
|-------|------|---------|
| 1 | `picking` | Collect items from warehouse shelves |
| 2 | `packing` | Pack items for shipment |
| 3 | `quality_check` | Verify contents and condition |
| 4 | `ready_to_ship` | Mark parcel ready for carrier handoff |

Defined in `FULFILLMENT_STAGES` (`apps/api/src/application/fulfillment/fulfillment.service.ts`).

---

## Task Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Not started (default on initialize) |
| `in_progress` | Operator started the stage |
| `completed` | Stage finished normally |
| `skipped` | Stage bypassed by an authorized operator |

---

## Ready-to-Ship Logic

An order is considered ready to ship when **every** stage has status `completed` or `skipped` (`DrizzleFulfillmentRepository.isReadyToShip`).

When `ready_to_ship` is **completed** and the order status is `preparing`, the order is automatically updated to `ready_to_ship` with note `"Fulfillment workflow completed"`.

Cancelled orders cannot enter or continue fulfillment (`BadRequestException`).

---

## Barcode & QR Code Generation

Barcode and QR data are **not** rendered as images by the API. They are stored as plain text on the task record when a stage is **completed**:

| Field | Value on complete |
|-------|-------------------|
| `barcode` | Order number (e.g. `HS-20260710-0001`) |
| `qrCodeData` | JSON string: `{"orderId":"<uuid>","orderNumber":"<orderNumber>"}` |

Set in `FulfillmentService.completeTask`. Clients (admin UI, label printers, handheld scanners) are responsible for encoding these values into barcode/QR images.

Skipped stages do **not** receive barcode/QR data.

---

## API Endpoints

All endpoints require `AuthGuard` (session cookie or Bearer token) and CSRF token on mutating requests.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/orders/:orderId` | `orders:read` | List all fulfillment tasks for an order |
| `POST` | `/orders/:orderId/initialize` | `orders:write` | Create tasks for all four stages (idempotent if already initialized) |
| `POST` | `/orders/:orderId/:stage/start` | `orders:write` | Start a stage; optional `assignedTo` (user UUID) |
| `POST` | `/orders/:orderId/:stage/complete` | `orders:write` | Complete a stage; optional `note` (max 500 chars) |
| `POST` | `/orders/:orderId/:stage/skip` | `orders:write` | Skip a stage |

`:stage` must be one of: `picking`, `packing`, `quality_check`, `ready_to_ship`. Invalid stages return `400 Bad Request`.

### Request bodies

**Start stage** (`StartStageDto`):
```json
{ "assignedTo": "optional-user-uuid" }
```

**Complete stage** (`CompleteStageDto`):
```json
{ "note": "optional note up to 500 characters" }
```

### Response shape

All endpoints return:
```json
{ "success": true, "data": { /* task or task[] */ } }
```

---

## Database Schema

Migration: `packages/database/drizzle/0003_m3_operations.sql`

**Table**: `fulfillment_tasks`

| Column | Type | Notes |
|--------|------|-------|
| `order_id` | UUID | FK → `orders` |
| `stage` | enum | `fulfillment_stage` |
| `status` | enum | `fulfillment_status` |
| `assigned_to` | UUID | FK → `users`, nullable |
| `barcode` | varchar(50) | Set on complete |
| `qr_code_data` | text | Set on complete |
| `note` | text | Operator note |
| `started_at` / `completed_at` | timestamptz | Stage timing |
| `completed_by` | UUID | FK → `users` |

**Indexes**:
- Unique: `(order_id, stage)`
- Index: `order_id`

---

## Automation Integration

| Trigger | Action |
|---------|--------|
| Order → `confirmed` | `FulfillmentService.initializeForOrder` |
| Order → `ready_to_ship` (via automation) | Attempts auto-shipment creation (see `SHIPPING.md`) |

---

## RBAC

| Role | Relevant permissions |
|------|---------------------|
| `fulfillment_agent` | `orders:read`, `orders:write`, `shipping:read`, `shipping:write` |
| `super_admin` | All permissions |

---

## Related Files

- `apps/api/src/application/fulfillment/fulfillment.service.ts`
- `apps/api/src/infrastructure/persistence/drizzle/drizzle-fulfillment.repository.ts`
- `apps/api/src/presentation/modules/fulfillment/fulfillment.controller.ts`
- `apps/api/src/application/automation/automation.service.ts`
