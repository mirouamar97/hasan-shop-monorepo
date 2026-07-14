-- M2: Order Management & Checkout System
-- Enum values must be added in their own migration/transaction before use.

ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'preparing';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'ready_to_ship';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'customer_refused';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'failed_delivery';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'refunded';
