'use server'

import { and, eq, inArray, type SQL, sql } from 'drizzle-orm'
import db from '@/db'
import { getTableFields } from '@/db/db.helpers'
import { syncedItems } from '@/db/schema/syncedItems.schema'
import type { ProductMapping } from '@/features/items-sync/types'
import User from '@/lib/copilot/models/User.model'

export const updateSyncedItemsAction = async (
  token: string,
  tenantId: string,
  productMappings: ProductMapping[],
) => {
  const user = await User.authenticate(token)

  const sqlChunks: SQL[] = [sql`(CASE`]

  for (const map of productMappings) {
    sqlChunks.push(
      sql`WHEN ${syncedItems.priceId} = ${map.price.id} THEN ${map.item?.itemID || 'NULL'}`,
    )
  }
  const itemIdCases: SQL = sql.join(sqlChunks, sql.raw(' '))

  const mappings = await db
    .update(syncedItems)
    .set({ itemId: itemIdCases })
    .where(
      and(
        eq(syncedItems.portalId, user.portalId),
        eq(syncedItems.tenantId, tenantId),
        inArray(
          syncedItems.priceId,
          productMappings.map((mapping) => mapping.price.id),
        ),
      ),
    )
    .returning(getTableFields(syncedItems, ['productId', 'priceId', 'itemId']))
  return mappings
}
