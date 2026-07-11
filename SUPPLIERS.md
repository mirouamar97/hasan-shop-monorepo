# HASAN SHOP — Supplier Management (M3)

**Last Updated**: 2026-07-10  
**Scope**: Supplier CRUD, product assignment, auto-assignment rules  
**Base URL**: `/api/v1/admin/suppliers`

---

## Overview

M3 extends supplier management with lead-time tracking, margin defaults, and automatic product-to-supplier assignment logic. Suppliers are linked to products via `products.supplier_id`.

---

## Supplier Model

| Field | Type | Notes |
|-------|------|-------|
| `name` | string (max 200) | Display name |
| `slug` | string (max 100) | Unique identifier |
| `type` | `local` \| `international` | Default `local` |
| `contactName` | string | Optional |
| `contactPhone` | string (max 30) | Optional |
| `contactEmail` | email | Optional |
| `address` | string (max 500) | Optional |
| `wilayaCode` | string (max 10) | Optional |
| `leadTimeDays` | integer | Default `3` (M3 column) |
| `notes` | text | Internal notes (M3 column) |
| `defaultMarginPercent` | decimal(5,2) | Optional pricing margin |
| `isActive` | boolean | Default `true` on create |
| `productCount` | computed | Count of linked products |

Migration `0003_m3_operations.sql` adds `lead_time_days`, `notes`, `default_margin_percent`.

---

## API Endpoints

All endpoints require `AuthGuard` and CSRF on mutations.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/` | `suppliers:read` | List suppliers (`?activeOnly=true` default) |
| `GET` | `/:id` | `suppliers:read` | Get supplier by UUID |
| `POST` | `/` | `suppliers:write` | Create supplier |
| `PUT` | `/:id` | `suppliers:write` | Update supplier |
| `DELETE` | `/:id` | `suppliers:write` | Delete supplier |

### Create / update body

```json
{
  "name": "Supplier Name",
  "slug": "supplier-slug",
  "type": "local",
  "contactName": "Contact",
  "contactPhone": "0555123456",
  "contactEmail": "supplier@example.dz",
  "address": "Address",
  "wilayaCode": "16",
  "leadTimeDays": 3,
  "notes": "Internal notes",
  "defaultMarginPercent": "15.00",
  "isActive": true
}
```

**Validation**:
- `slug` must be unique (`409 Conflict` on duplicate)
- `type` must be `local` or `international`

---

## Product Assignment

### Manual assignment (service layer)

`SupplierService.assignProduct(productId, supplierId | null)` updates `products.supplier_id`. Pass `null` to unassign.

> **Note**: No dedicated HTTP endpoint exposes manual or auto-assignment in M3. Assignment is available to application services and future catalog/admin endpoints.

### Auto-assignment rules

`SupplierService.autoAssignProduct(productId)` and `DrizzleSupplierRepository.findBestSupplierForProduct` implement the following priority:

```
1. If product already has supplier_id AND that supplier is active
   → keep / return that supplier

2. Else select the active supplier with the lowest lead_time_days
   (ORDER BY lead_time_days ASC LIMIT 1)

3. If no suitable supplier found
   → BadRequestException: "No suitable supplier found for product {id}"
```

On success, `autoAssignProduct` writes the chosen supplier to `products.supplier_id` and returns the supplier record.

### Listing supplier products

`SupplierService.listProducts(supplierId)` returns products linked to a supplier (SKU, name, prices, active status). Not exposed via HTTP in M3.

---

## Order Integration

At checkout, `supplierId` from the product is copied to `order_items.supplier_id` (`DrizzleCheckoutRepository`), preserving supplier attribution on each line item.

---

## RBAC

| Permission | Description |
|------------|-------------|
| `suppliers:read` | View suppliers |
| `suppliers:write` | Create, update, delete suppliers |

| Role | Permissions |
|------|-------------|
| `catalog_manager` | `suppliers:read` |
| `fulfillment_agent` | `suppliers:read` |
| `super_admin` | All |

---

## Related Files

- `apps/api/src/application/suppliers/supplier.service.ts`
- `apps/api/src/infrastructure/persistence/drizzle/drizzle-supplier.repository.ts`
- `apps/api/src/presentation/modules/suppliers/suppliers.controller.ts`
- `apps/api/src/domain/repositories/supplier.repository.ts`
