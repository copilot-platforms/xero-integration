import { boolean, jsonb, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import type { TokenSet } from 'xero-node'
import type z from 'zod'
import { timestamps } from '@/db/db.helpers'

export const xeroConnections = pgTable(
  'xero_connections',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),

    // Workspace ID / Portal ID in Copilot
    portalId: varchar({ length: 16 }).notNull(),

    // Active Tenant ID (most recently connected Xero organization)
    tenantId: uuid(),

    // Xero tokenset returned after a successful OAuth connection
    tokenSet: jsonb().$type<TokenSet>(),

    // Connection status
    status: boolean().notNull().default(false),

    // Copilot internalUserId that initiated the connection
    initiatedBy: uuid().notNull(),

    ...timestamps,
  },
  (table) => [uniqueIndex('uq_xero_connections_portal_id').on(table.portalId)],
)

export const XeroConnectionSchema = createSelectSchema(xeroConnections)
export type XeroConnection = z.infer<typeof XeroConnectionSchema>
// Authenticated xero connection (must have valid tokenSet + tenantId)
export type XeroConnectionWithTokenSet = XeroConnection & {
  tokenSet: TokenSet
  tenantId: string
}

export const XeroConnectionInsertPayloadSchema = createInsertSchema(xeroConnections)
export type XeroConnectionInsertPayload = z.infer<typeof XeroConnectionInsertPayloadSchema>

export const XeroConnectionUpdatePayloadSchema = createUpdateSchema(xeroConnections).omit({
  id: true,
  portalId: true,
})
export type XeroConnectionUpdatePayload = z.infer<typeof XeroConnectionUpdatePayloadSchema>
