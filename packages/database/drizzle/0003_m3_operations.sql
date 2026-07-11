-- M3: Shipping, Fulfillment, Inventory, CRM, Suppliers

-- Order number sequence (collision-safe)
CREATE TABLE IF NOT EXISTS "order_number_sequences" (
  "date_key" varchar(8) PRIMARY KEY NOT NULL,
  "last_value" integer NOT NULL DEFAULT 0
);

-- Inventory movements audit trail
CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "movement_type" varchar(30) NOT NULL,
  "quantity_change" integer NOT NULL,
  "quantity_before" integer NOT NULL,
  "quantity_after" integer NOT NULL,
  "reference_type" varchar(30),
  "reference_id" uuid,
  "note" text,
  "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "inventory_movements_product_idx" ON "inventory_movements" ("product_id");
CREATE INDEX IF NOT EXISTS "inventory_movements_created_at_idx" ON "inventory_movements" ("created_at");

-- Fulfillment workflow tasks
CREATE TYPE "fulfillment_stage" AS ENUM ('picking', 'packing', 'quality_check', 'ready_to_ship');
CREATE TYPE "fulfillment_status" AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

CREATE TABLE IF NOT EXISTS "fulfillment_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "stage" "fulfillment_stage" NOT NULL,
  "status" "fulfillment_status" NOT NULL DEFAULT 'pending',
  "assigned_to" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "barcode" varchar(50),
  "qr_code_data" text,
  "note" text,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "completed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "fulfillment_tasks_order_stage_idx" ON "fulfillment_tasks" ("order_id", "stage");
CREATE INDEX IF NOT EXISTS "fulfillment_tasks_order_id_idx" ON "fulfillment_tasks" ("order_id");

-- Customer CRM
CREATE TABLE IF NOT EXISTS "customer_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE CASCADE,
  "phone" varchar(15),
  "note" text NOT NULL,
  "author_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "customer_notes_customer_idx" ON "customer_notes" ("customer_id");
CREATE INDEX IF NOT EXISTS "customer_notes_phone_idx" ON "customer_notes" ("phone");

CREATE TABLE IF NOT EXISTS "customer_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE CASCADE,
  "phone" varchar(15),
  "tag" varchar(50) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "customer_tags_customer_idx" ON "customer_tags" ("customer_id");
CREATE INDEX IF NOT EXISTS "customer_tags_tag_idx" ON "customer_tags" ("tag");

-- Supplier enhancements
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "lead_time_days" integer DEFAULT 3;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "default_margin_percent" decimal(5,2);

-- Composite index for admin order queries
CREATE INDEX IF NOT EXISTS "orders_status_created_at_idx" ON "orders" ("status", "created_at" DESC);

-- Shipment events index for webhooks
CREATE INDEX IF NOT EXISTS "shipment_events_shipment_id_idx" ON "shipment_events" ("shipment_id");
