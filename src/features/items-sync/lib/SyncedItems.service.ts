import 'server-only'

import type { PriceCreatedEvent } from '@invoice-sync/types'
import { and, eq, inArray } from 'drizzle-orm'
import status from 'http-status'
import type { Item } from 'xero-node'
import z from 'zod'
import db from '@/db'
import { getTableFields } from '@/db/db.helpers'
import { syncedItems } from '@/db/schema/syncedItems.schema'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ItemUpdatePayload } from '@/lib/xero/types'
import { htmlToText } from '@/utils/html'
import type { Mappable } from '../types'

class SyncedItemsService extends AuthenticatedXeroService {
  async createItems(itemsToCreate: Item[], prices: Record<string, PriceCreatedEvent>) {
    if (!itemsToCreate.length) return []

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

  /**
   * Returns a list of Mappable items where the key is the priceId (guarenteed to be unique)
   */
  async getSyncedItemsMapByPriceIds(priceIds: string[] | 'all'): Promise<Record<string, Mappable>> {
    const dbMappings = await db
      .select(getTableFields(syncedItems, ['productId', 'priceId', 'itemId']))
      .from(syncedItems)
      .where(
        and(
          eq(syncedItems.portalId, this.user.portalId),
          eq(syncedItems.tenantId, this.connection.tenantId),
          priceIds === 'all' ? undefined : inArray(syncedItems.priceId, priceIds),
        ),
      )
    return dbMappings.reduce<Record<string, (typeof dbMappings)[0]>>((acc, mapping) => {
      acc[mapping.priceId] = mapping
      return acc
    }, {})
  }

  async updateSyncedItemsForProductId(
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

  async createSyncedItemsForPrices(prices: PriceCreatedEvent[]): Promise<Item[]> {
    const createdItems: Item[] = []

    for (const price of prices) {
      const productMap = await this.copilot.getProductsMapById([price.productId])
      const product = productMap[price.productId]
      if (!product) {
        throw new APIError('Could not find product for mapping', status.BAD_REQUEST)
      }

      const payload = {
        code: price.id,
        name: product.name,
        description: htmlToText(product.description),
        isPurchased: false,
        salesDetails: {
          unitPrice: price.amount / 100,
        },
      }

      const items = await this.createItems([payload], { [price.id]: price })
      createdItems.push(items[0])
    }
    return createdItems
  }

  async addSyncedItems(items: Mappable[]) {
    // We have to do this one-by-one because xero doesn't provide a bulk delete API
    for (const item of items) {
      logger.info('SyncedItemsService#addSyncedItems :: Adding mapping', item)

      if (!item.itemId) {
        logger.warn(
          'SyncedItemsService#addSyncedItem :: Attempted to add non existant itemId for ',
          item,
        )
        return
      }

      await db.insert(syncedItems).values({
        portalId: this.user.portalId,
        tenantId: this.connection.tenantId,
        productId: item.productId,
        priceId: item.priceId,
        itemId: item.itemId,
      })
    }
  }

  async deleteSyncedItems(items: Mappable[]) {
    // We have to do this one-by-one because xero doesn't provide a bulk delete API
    for (const item of items) {
      logger.info('SyncedItemsService#deleteSyncedItems :: Deleting mapping', item)

      if (!item.itemId) {
        logger.warn(
          'SyncedItemsService#deleteSyncedItem :: Attempted to delete non existant itemId for ',
          item,
        )
        return
      }

      await db
        .delete(syncedItems)
        .where(
          and(
            eq(syncedItems.portalId, this.user.portalId),
            eq(syncedItems.tenantId, this.connection.tenantId),
            eq(syncedItems.productId, item.productId),
            eq(syncedItems.priceId, item.priceId),
            eq(syncedItems.itemId, item.itemId),
          ),
        )
    }
  }
}

export default SyncedItemsService
