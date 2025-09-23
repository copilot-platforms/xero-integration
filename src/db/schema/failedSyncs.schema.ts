import { integer, jsonb, pgEnum, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '@/db/db.helpers'
import { ValidWebhookEvent } from '@/features/invoice-sync/types'

export const failedSyncTypeEnum = pgEnum('failed_syncs_type', [
  ValidWebhookEvent.InvoiceCreated,
  ValidWebhookEvent.ProductUpdated,
  ValidWebhookEvent.PriceCreated,
])

export const failedSyncs = pgTable(
  'failed_syncs',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),

    // Workspace ID / Portal ID in Copilot
    portalId: varchar({ length: 16 }).notNull(),

    // Type of sync
    type: failedSyncTypeEnum().notNull(),

    // Token used for sync
    token: varchar({ length: 1024 }).notNull(),

    // ID of the resource (price / invoice)
    resourceId: varchar({ length: 64 }).notNull(),

    // Number of attempts to sync item
    attempts: integer().notNull().default(0),

    // Payload of the failed sync webhook
    payload: jsonb().notNull(),

    // Active Tenant ID (most recently connected Xero organization)
    tenantId: uuid().notNull(),

    ...timestamps,
  },

  // Only allow one failed sync record per failed resource
  (t) => [uniqueIndex('uq_failed_syncs_resource_id').on(t.resourceId)],
)
