import 'server-only'

import type { PriceCreatedEvent } from '@invoice-sync/types'
import { and, eq, inArray } from 'drizzle-orm'
import type { Item } from 'xero-node'
import z from 'zod'
import db from '@/db'
import { syncedItems } from '@/db/schema/syncedItems.schema'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ItemUpdatePayload } from '@/lib/xero/types'

class SyncedItemsService extends AuthenticatedXeroService {
  async createItems(itemsToCreate: Item[], prices: Record<string, PriceCreatedEvent>) {
    const newlyCreatedItems = await this.xero.createItems(this.connection.tenantId, itemsToCreate)
    await db.insert(syncedItems).values(
      newlyCreatedItems.map((item) => ({
        portalId: this.user.portalId,
        productId: prices[item.code].productId,
        priceId: item.code,
        itemId: z.uuid().parse(item.itemID),
        tenantId: this.connection.tenantId,
      })),
    )
    return newlyCreatedItems
  }

  async getSyncedItemsByPriceIds(priceIds: string[]) {
    return await db
      .select({
        productId: syncedItems.productId,
        priceId: syncedItems.priceId,
        itemId: syncedItems.itemId,
      })
      .from(syncedItems)
      .where(
        and(
          eq(syncedItems.portalId, this.user.portalId),
          eq(syncedItems.tenantId, this.connection.tenantId),
          inArray(syncedItems.priceId, priceIds),
        ),
      )
  }

  async updateXeroItemsForProductId(
    productId: string,
    payload: ItemUpdatePayload,
  ): Promise<Item[]> {
    const syncedItemRecords = await db
      .select()
      .from(syncedItems)
      .where(
        and(
          eq(syncedItems.portalId, this.user.portalId),
          eq(syncedItems.tenantId, this.connection.tenantId),
          eq(syncedItems.productId, productId),
        ),
      )
    if (!syncedItemRecords.length) {
      logger.info(
        'SyncedItemsService#updateXeroItemsForProductId :: Did not find any synced products. Ignoring.',
      )
      return []
    }

    const items: Item[] = []
    for (const item of syncedItemRecords) {
      // This is a bit slower but since this is an async task, it hardly matters
      const updatedItem = await this.xero.updateItem(this.connection.tenantId, item.itemId, {
        code: item.priceId, // code is always item's priceId since this is guaranteed to be unique
        ...payload,
      })
      items.push(updatedItem)
    }
    return items
  }
}

export default SyncedItemsService
