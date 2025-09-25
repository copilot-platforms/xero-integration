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

CREATE UNIQUE INDEX "uq_settings_portal_id_tenant_id" ON "settings" USING btree ("portal_id","tenant_id");