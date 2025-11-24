import { desc } from 'drizzle-orm'
import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { timestamps } from '@/db/db.helpers'

export enum SyncEventType {
  CREATED = 'created',
  MAPPED = 'mapped',
  UNMAPPED = 'unmapped',
  PAID = 'paid',
  VOIDED = 'voided',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

export enum SyncStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  INFO = 'info',
}

export enum SyncEntityType {
  INVOICE = 'invoice',
  CUSTOMER = 'customer',
  PRODUCT = 'product',
  EXPENSE = 'expense',
}

export const syncEventType = pgEnum('sync_logs_event_type', SyncEventType)
export const syncStatus = pgEnum('sync_logs_status', SyncStatus)
export const syncEntityType = pgEnum('sync_logs_entity_type', SyncEntityType)

export const syncLogs = pgTable(
  'sync_logs',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),

    // Workspace ID / Portal ID in Copilot
    portalId: varchar({ length: 16 }).notNull(),

    // Active Tenant ID for Xero
    tenantId: uuid().notNull(),

    syncDate: timestamp({ withTimezone: true, mode: 'date' }).notNull(),

    eventType: syncEventType().notNull(),

    status: syncStatus().notNull(),

    entityType: syncEntityType().notNull(),

    copilotId: varchar({ length: 128 }),

    xeroId: uuid(),

    invoiceNumber: varchar({ length: 128 }),

    customerName: varchar({ length: 255 }),

    customerEmail: varchar({ length: 255 }),

    amount: numeric(),

    taxAmount: numeric(),

    feeAmount: numeric(),

    productName: varchar({ length: 512 }),

    productPrice: numeric(),

    xeroItemName: varchar({ length: 512 }),

    errorMessage: text(),

    ...timestamps,
  },
  (t) => [
    index('idx_sync_logs_portal_id_tenant_id_created_at').on(
      t.portalId,
      t.tenantId,
      desc(t.createdAt),
    ),
  ],
)
