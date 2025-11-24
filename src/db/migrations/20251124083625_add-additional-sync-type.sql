CREATE TYPE "public"."synced_payments_payment_type" AS ENUM('payment', 'expense');
ALTER TABLE "synced_payments" ADD COLUMN "type" "synced_payments_payment_type" DEFAULT 'payment';