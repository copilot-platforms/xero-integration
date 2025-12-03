ALTER TABLE "failed_syncs" ALTER COLUMN "portal_id" SET DATA TYPE varchar(64);
ALTER TABLE "sync_logs" ALTER COLUMN "portal_id" SET DATA TYPE varchar(64);
ALTER TABLE "synced_contacts" ALTER COLUMN "portal_id" SET DATA TYPE varchar(64);
ALTER TABLE "synced_invoices" ALTER COLUMN "portal_id" SET DATA TYPE varchar(64);
ALTER TABLE "synced_items" ALTER COLUMN "portal_id" SET DATA TYPE varchar(64);
ALTER TABLE "synced_payments" ALTER COLUMN "portal_id" SET DATA TYPE varchar(64);
ALTER TABLE "xero_connections" ALTER COLUMN "portal_id" SET DATA TYPE varchar(64);