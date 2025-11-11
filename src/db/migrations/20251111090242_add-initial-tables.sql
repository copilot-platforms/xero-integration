CREATE TYPE "public"."failed_syncs_type" AS ENUM('invoice.created', 'product.updated', 'price.created');

CREATE TYPE "public"."synced_invoices_status" AS ENUM('pending', 'failed', 'success');

CREATE TABLE "failed_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "failed_syncs_type" NOT NULL,
	"token" varchar(1024) NOT NULL,
	"resource_id" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sync_products_automatically" boolean DEFAULT false NOT NULL,
	"add_absorbed_fees" boolean DEFAULT false NOT NULL,
	"use_company_name" boolean DEFAULT false NOT NULL,
	"is_sync_enabled" boolean DEFAULT false NOT NULL,
	"initial_invoice_settings_mapping" boolean DEFAULT false NOT NULL,
	"initial_product_settings_mapping" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "synced_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "synced_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"copilot_invoice_id" varchar(64) NOT NULL,
	"xero_invoice_id" uuid,
	"status" "synced_invoices_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "synced_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"price_id" varchar(64) NOT NULL,
	"item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "xero_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid,
	"token_set" jsonb,
	"status" boolean DEFAULT false NOT NULL,
	"initiated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "uq_failed_syncs_resource_id" ON "failed_syncs" USING btree ("resource_id");
CREATE UNIQUE INDEX "uq_settings_portal_id_tenant_id" ON "settings" USING btree ("portal_id","tenant_id");
CREATE UNIQUE INDEX "uq_synced_contacts_portal_id_client_id" ON "synced_contacts" USING btree ("portal_id","client_id");
CREATE UNIQUE INDEX "uq_synced_invoices_portal_id_copilot_invoice_id" ON "synced_invoices" USING btree ("portal_id","copilot_invoice_id");
CREATE UNIQUE INDEX "uq_synced_items_portal_id_product_id_price_id" ON "synced_items" USING btree ("portal_id","product_id","price_id");
CREATE UNIQUE INDEX "uq_xero_connections_portal_id" ON "xero_connections" USING btree ("portal_id");
