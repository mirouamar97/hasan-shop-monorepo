-- M2: migrate legacy statuses + order ops schema (after enum values committed)

UPDATE "orders" SET "status" = 'preparing' WHERE "status" = 'processing';
UPDATE "orders" SET "status" = 'shipped' WHERE "status" = 'out_for_delivery';
UPDATE "orders" SET "status" = 'completed' WHERE "status" = 'paid';
UPDATE "orders" SET "status" = 'customer_refused' WHERE "status" = 'refused';
UPDATE "orders" SET "status" = 'pending' WHERE "status" = 'awaiting_confirmation';

UPDATE "order_status_history" SET "from_status" = 'preparing' WHERE "from_status" = 'processing';
UPDATE "order_status_history" SET "to_status" = 'preparing' WHERE "to_status" = 'processing';
UPDATE "order_status_history" SET "from_status" = 'shipped' WHERE "from_status" = 'out_for_delivery';
UPDATE "order_status_history" SET "to_status" = 'shipped' WHERE "to_status" = 'out_for_delivery';
UPDATE "order_status_history" SET "from_status" = 'completed' WHERE "from_status" = 'paid';
UPDATE "order_status_history" SET "to_status" = 'completed' WHERE "to_status" = 'paid';
UPDATE "order_status_history" SET "from_status" = 'customer_refused' WHERE "from_status" = 'refused';
UPDATE "order_status_history" SET "to_status" = 'customer_refused' WHERE "to_status" = 'refused';
UPDATE "order_status_history" SET "from_status" = 'pending' WHERE "from_status" = 'awaiting_confirmation';
UPDATE "order_status_history" SET "to_status" = 'pending' WHERE "to_status" = 'awaiting_confirmation';

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "assigned_operator_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_estimate_days" integer;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_estimate_text" varchar(200);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(64);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_idempotency_key_idx" ON "orders" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "orders_assigned_operator_id_idx" ON "orders" ("assigned_operator_id");
CREATE INDEX IF NOT EXISTS "orders_shipping_phone_idx" ON "orders" ("shipping_phone");

CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cart_product_variant_idx"
  ON "cart_items" ("cart_id", "product_id", COALESCE("variant_id", '00000000-0000-0000-0000-000000000000'::uuid));

CREATE TABLE IF NOT EXISTS "recently_viewed" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_token" varchar(255),
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "recently_viewed_session_idx" ON "recently_viewed" ("session_token");
CREATE INDEX IF NOT EXISTS "recently_viewed_customer_idx" ON "recently_viewed" ("customer_id");
CREATE INDEX IF NOT EXISTS "recently_viewed_viewed_at_idx" ON "recently_viewed" ("viewed_at");

CREATE TABLE IF NOT EXISTS "notification_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(80) NOT NULL UNIQUE,
  "channel" varchar(20) NOT NULL,
  "name" varchar(120) NOT NULL,
  "subject" varchar(255),
  "body" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "channel" varchar(20) NOT NULL,
  "template_slug" varchar(80),
  "recipient" varchar(255) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "error_message" text,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "notification_logs_order_id_idx" ON "notification_logs" ("order_id");
