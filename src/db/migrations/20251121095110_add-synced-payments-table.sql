ALTER TYPE "public"."failed_syncs_type" ADD VALUE 'payment.succeeded';
CREATE TABLE "synced_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"copilot_invoice_id" varchar(64) NOT NULL,
	"xero_invoice_id" uuid NOT NULL,
	"copilot_payment_id" varchar(64),
	"xero_payment_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "uq_synced_payments_portal_id_tenant_id_copilot_invoice_id" ON "synced_payments" USING btree ("portal_id","tenant_id","copilot_invoice_id");
CREATE UNIQUE INDEX "uq_synced_payments_xero_payment_id" ON "synced_payments" USING btree ("xero_payment_id");