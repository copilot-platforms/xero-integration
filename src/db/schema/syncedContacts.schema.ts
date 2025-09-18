import { pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '@/db/db.helpers'

export const syncedContacts = pgTable(
  'synced_contacts',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),

    // Workspace ID / Portal ID in Copilot
    portalId: varchar({ length: 16 }).notNull(),

    // Copilot ClientID
    clientId: uuid().notNull(),

    // Xero contactID (Ref: https://developer.xero.com/documentation/api/accounting/contacts)
    contactId: uuid().notNull(),

    // Active Tenant ID for Xero
    tenantId: uuid().notNull(),

    ...timestamps,
  },
  (t) => [
    // Each client within a portal must have ONLY ONE mapping to a contact
    uniqueIndex('uq_synced_contacts_portal_id_client_id').on(t.portalId, t.clientId),
  ],
)
