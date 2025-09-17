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

CREATE UNIQUE INDEX "uq_synced_items_portal_id_product_id_price_id" ON "synced_items" USING btree ("portal_id","product_id","price_id");