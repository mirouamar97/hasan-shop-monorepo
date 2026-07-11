CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "locale" varchar(5) DEFAULT 'ar' NOT NULL,
  "source" varchar(50) DEFAULT 'homepage' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_idx" ON "newsletter_subscribers" ("email");
