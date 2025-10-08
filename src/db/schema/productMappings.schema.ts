import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '@/db/db.helpers'

export const productMappings = pgTable('product_mappings', {
  id: uuid().defaultRandom().primaryKey(),

  // Workspace ID / Portal ID in Copilot
  portalId: varchar({ length: 255 }).notNull(),

  // Active Tenant ID (most recently connected Xero organization)
  tenantId: uuid().notNull(),

  // Product ID for copilot
  productId: uuid().notNull(),

  // Price ID for copilot
  priceId: varchar().notNull(),

  // Item ID for Xero item
  itemId: uuid(),

  ...timestamps,
})
