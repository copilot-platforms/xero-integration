ALTER TYPE "public"."failed_syncs_type" ADD VALUE 'invoice.paid' BEFORE 'product.updated';
ALTER TYPE "public"."failed_syncs_type" ADD VALUE 'invoice.voided' BEFORE 'product.updated';
ALTER TYPE "public"."failed_syncs_type" ADD VALUE 'invoice.deleted' BEFORE 'product.updated';