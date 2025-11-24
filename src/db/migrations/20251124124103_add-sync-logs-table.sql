CREATE TYPE "public"."sync_logs_entity_type" AS ENUM('invoice', 'customer', 'product', 'expense');
CREATE TYPE "public"."sync_logs_event_type" AS ENUM('created', 'mapped', 'unmapped', 'paid', 'voided', 'updated', 'deleted');
CREATE TYPE "public"."sync_logs_status" AS ENUM('success', 'failed', 'info');
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sync_date" timestamp with time zone NOT NULL,
	"event_type" "sync_logs_event_type" NOT NULL,
	"status" "sync_logs_status" NOT NULL,
	"entity_type" "sync_logs_entity_type" NOT NULL,
	"copilot_id" varchar(128),
	"xero_id" uuid,
	"invoice_number" varchar(128),
	"customer_name" varchar(255),
	"customer_email" varchar(255),
	"amount" numeric,
	"tax_amount" numeric,
	"fee_amount" numeric,
	"product_name" varchar(512),
	"product_price" numeric,
	"xero_item_name" varchar(512),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_sync_logs_portal_id_tenant_id_created_at" ON "sync_logs" USING btree ("portal_id","tenant_id","created_at" desc);