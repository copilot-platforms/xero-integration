import SyncedItemsService from '@items-sync/lib/SyncedItems.service'
import type { Mappable, ProductMapping } from '@items-sync/types'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { type SyncedItem, syncedItems } from '@/db/schema/syncedItems.schema'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ClientXeroItem } from '@/lib/xero/types'

/**
 * ProductMappingsService is a child class of SyncedItemsService that deals specifically with manually Synced items
 */
class ProductMappingsService extends AuthenticatedXeroService {
  async getClientXeroItems(): Promise<ClientXeroItem[]> {
    logger.info(
      'ProductMappingsService#getClientXeroItems :: Getting client xero items for portalId',
      this.user.portalId,
    )

    const xeroItems = await this.xero.getItems(this.connection.tenantId)
    return xeroItems.map((item) => ({
      itemID: z.string().parse(item.itemID),
      code: z.string().parse(item.code),
      name: item.name || '',
      amount: item.salesDetails?.unitPrice || 0,
    }))
  }

  async getProductMappings(): Promise<ProductMapping[]> {
    logger.info(
      'ProductMappingsService#getProductMappings :: Getting product mappings for portalId',
      this.user.portalId,
    )

    const syncedItemsService = new SyncedItemsService(this.user, this.connection)
    const mappingRecords = await syncedItemsService.getSyncedItemsMapByPriceIds('all')

    const [xeroItems, copilotProducts, copilotPrices] = await Promise.all([
      this.xero.getItemsMap(this.connection.tenantId),
      this.copilot.getProductsMapById('all'),
      this.copilot.getPricesMapById('all'),
    ])

    if (!copilotPrices || !copilotProducts) return []

    const mappings = Object.values(copilotPrices)
      // Sort by decreasing createdAt date
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      // Map each to distinct price, product & item objs
      .map((price) => {
        const mapping = mappingRecords[price.id]
        const item = mapping && xeroItems[mapping.itemId || '']
        return {
          price,
          product: copilotProducts[price.productId],
          item: item
            ? {
                itemID: item.itemID,
                code: item.code,
                name: item.name,
                amount: item.salesDetails?.unitPrice || 0,
              }
            : null,
        }
      })
      // Because the list endpoint could contain data for deleted products with hanging prices as well, remove them!
      .filter((obj) => obj.product)

    return mappings
  }

  async updateMappedItems(productMappings: Mappable[]): Promise<ProductMapping[]> {
    logger.info(
      'ProductMappingsService#updateMappedItems :: Updating product mappings:',
      productMappings,
    )

    // Create a map with priceId as key and SyncedItem as value
    const dbMappings = (
      await this.db
        .select()
        .from(syncedItems)
        .where(
          and(
            eq(syncedItems.portalId, this.user.portalId),
            eq(syncedItems.tenantId, this.connection.tenantId),
          ),
        )
    ).reduce<Record<string, SyncedItem>>((acc, mapping) => {
      acc[mapping.priceId] = mapping
      return acc
    }, {})

    const addedMappings: Mappable[] = [],
      deletedMappings: Mappable[] = []

    for (const mapping of productMappings) {
      const existingMapping = dbMappings[mapping.priceId]

      // CASE I: Mapping exists or doesn't exist and is unchanged
      if (
        (mapping.itemId && existingMapping?.itemId === mapping.itemId) ||
        (!existingMapping?.itemId && !mapping.itemId)
      ) {
        continue
      }

      // CASE II: Mapping is removed
      if (existingMapping?.itemId && !mapping.itemId) {
        deletedMappings.push(existingMapping)
      }

      // CASE III: New mapping is added
      if (!existingMapping?.itemId && mapping.itemId) {
        addedMappings.push(mapping)
      }

      // Case IV: Mapping is changed from one itemID to another
      if (existingMapping && mapping.itemId && existingMapping.itemId !== mapping.itemId) {
        deletedMappings.push(existingMapping)
        addedMappings.push(mapping)
      }
    }

    const syncedItemsService = new SyncedItemsService(this.user, this.connection)

    // First delete unwanted mappings
    await syncedItemsService.deleteSyncedItems(deletedMappings)
    // Then add new mappings. EZ PZ
    await syncedItemsService.addSyncedItems(addedMappings)

    return await this.getProductMappings()
  }
}

export default ProductMappingsService
