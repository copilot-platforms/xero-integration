CREATE TYPE "public"."synced_invoices_status" AS ENUM('pending', 'failed', 'success');
CREATE TABLE "synced_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"client_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "synced_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"copilot_invoice_id" varchar(64) NOT NULL,
	"xero_invoice_id" uuid,
	"status" "synced_invoices_status" DEFAULT 'pending' NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "synced_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"price_id" varchar(64) NOT NULL,
	"item_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "xero_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"token_set" jsonb,
	"status" boolean DEFAULT false NOT NULL,
	"initiated_by" uuid NOT NULL,
	"tenant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "uq_synced_contacts_portal_id_client_id" ON "synced_contacts" USING btree ("portal_id","client_id");
CREATE UNIQUE INDEX "uq_synced_invoices_portal_id_copilot_invoice_id" ON "synced_invoices" USING btree ("portal_id","copilot_invoice_id");
CREATE UNIQUE INDEX "uq_synced_items_portal_id_product_id_price_id" ON "synced_items" USING btree ("portal_id","product_id","price_id");
CREATE UNIQUE INDEX "uq_xero_connections_portal_id" ON "xero_connections" USING btree ("portal_id");