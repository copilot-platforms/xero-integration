CREATE TYPE "public"."failed_syncs_type" AS ENUM('invoice.created', 'product.updated', 'price.created');
CREATE TABLE "failed_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar(16) NOT NULL,
	"type" "failed_syncs_type" NOT NULL,
	"token" varchar(1024) NOT NULL,
	"resource_id" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"payload" jsonb NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "uq_failed_syncs_resource_id" ON "failed_syncs" USING btree ("resource_id");