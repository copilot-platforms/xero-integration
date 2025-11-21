import 'server-only'

import type { PriceCreatedEvent } from '@invoice-sync/types'
import type { Mappable } from '@items-sync/types'
import { and, eq, inArray } from 'drizzle-orm'
import status from 'http-status'
import type { Item } from 'xero-node'
import z from 'zod'
import { getTableFields } from '@/db/db.helpers'
import { syncedItems } from '@/db/schema/syncedItems.schema'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ItemUpdatePayload } from '@/lib/xero/types'
import { htmlToText } from '@/utils/html'
import { genRandomString } from '@/utils/string'

class SyncedItemsService extends AuthenticatedXeroService {
  async createItems(itemsToCreate: Item[], pricesForCode: Record<string, PriceCreatedEvent>) {
    logger.info('SyncedItemsService#createItems :: Creating items:', itemsToCreate, pricesForCode)

    if (!itemsToCreate.length) return []

    const newlyCreatedItems = await this.xero.createItems(this.connection.tenantId, itemsToCreate)
    await this.db.insert(syncedItems).values(
      newlyCreatedItems.map((item) => {
        const price = pricesForCode[item.code]
        const insertPayload = {
          portalId: this.user.portalId,
          productId: price.productId,
          priceId: price.id,
          itemId: z.uuid().parse(item.itemID),
          tenantId: this.connection.tenantId,
        }
        logger.info(
          'SyncedItemsService#createItems :: Inserting synced item record:',
          insertPayload,
        )
        return insertPayload
      }),
    )
    return newlyCreatedItems
  }

  /**
   * Returns a list of Mappable items where the key is the priceId
   */
  async getSyncedItemsMapByPriceIds(priceIds: string[] | 'all'): Promise<Record<string, Mappable>> {
    logger.info(
      'SyncedItemsService#getSyncedItemsMapByPriceIds :: Getting synced items map for priceIds',
      priceIds,
    )

    const dbMappings = await this.db
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
    logger.info(
      'SyncedItemsService#updateSyncedItemsForProductId :: Updating synced items map for product',
      productId,
      'with payload',
      payload,
    )

    const syncedItemRecords = await this.db
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
    const xeroItemsMap = await this.xero.getItemsMap(this.connection.tenantId)

    for (const item of syncedItemRecords) {
      // This is a bit slower but since this is an async task, it hardly matters
      const updatedItem = await this.xero.updateItem(this.connection.tenantId, item.itemId, {
        code: xeroItemsMap[item.itemId].code,
        ...payload,
      })
      items.push(updatedItem)
    }
    return items
  }

  async createSyncedItemsForPrices(prices: PriceCreatedEvent[]): Promise<Item[]> {
    logger.info(
      'SyncedItemsService#createSyncedItemsForPrices :: Creating synced items for prices',
      prices,
    )
    const createdItems: Item[] = []

    for (const price of prices) {
      const productMap = await this.copilot.getProductsMapById([price.productId])
      const product = productMap[price.productId]
      if (!product) {
        throw new APIError('Could not find product for mapping', status.BAD_REQUEST)
      }

      const payload = {
        code: genRandomString(12),
        name: product.name,
        description: htmlToText(product.description),
        isPurchased: false,
        salesDetails: {
          unitPrice: price.amount / 100,
        },
      }

      const items = await this.createItems([payload], { [payload.code]: price })
      createdItems.push(items[0])
    }
    return createdItems
  }

  async addSyncedItems(items: Mappable[]) {
    logger.info('SyncedItemsService#addSyncedItems :: Adding synced items', items)

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

      await this.db.insert(syncedItems).values({
        portalId: this.user.portalId,
        tenantId: this.connection.tenantId,
        productId: item.productId,
        priceId: item.priceId,
        itemId: item.itemId,
      })
    }
  }

  async deleteSyncedItems(items: Mappable[]) {
    logger.info('SyncedItemsService#deleteSyncedItems :: Deleting synced items', items)
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

      await this.db
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
