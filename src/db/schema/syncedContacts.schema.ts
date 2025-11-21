import { pgEnum, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import type z from 'zod'
import { timestamps } from '@/db/db.helpers'

const userType = pgEnum('synced_contacts_contact_user_type', ['CLIENT', 'COMPANY'])

export const syncedContacts = pgTable(
  'synced_contacts',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),

    // Workspace ID / Portal ID in Copilot
    portalId: varchar({ length: 16 }).notNull(),

    // Active Tenant ID for Xero
    tenantId: uuid().notNull(),

    // Copilot ClientID or CompanyID
    clientOrCompanyId: uuid().notNull(),

    // Type of user (client / company)
    userType: userType().default('CLIENT').notNull(),

    // Xero contactID (Ref: https://developer.xero.com/documentation/api/accounting/contacts)
    contactId: uuid().notNull(),

    ...timestamps,
  },
  (t) => [
    // Each client within a portal must have ONLY ONE mapping to a contact
    uniqueIndex('uq_synced_contacts_portal_id_client_or_company_id').on(
      t.portalId,
      t.clientOrCompanyId,
    ),
  ],
)

export const SyncedContactSchema = createSelectSchema(syncedContacts)
export type SyncedContact = z.infer<typeof SyncedContactSchema>

export enum SyncedContactUserType {
  CLIENT = 'CLIENT',
  COMPANY = 'COMPANY',
}
