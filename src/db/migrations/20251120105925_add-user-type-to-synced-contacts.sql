CREATE TYPE "public"."synced_contacts_contact_user_type" AS ENUM('CLIENT', 'COMPANY');

ALTER TABLE "synced_contacts" RENAME COLUMN "client_id" TO "client_or_company_id";
DROP INDEX "uq_synced_contacts_portal_id_client_id";
ALTER TABLE "synced_contacts" ADD COLUMN "user_type" "synced_contacts_contact_user_type" DEFAULT 'CLIENT' NOT NULL;
CREATE UNIQUE INDEX "uq_synced_contacts_portal_id_client_or_company_id" ON "synced_contacts" USING btree ("portal_id","client_or_company_id");