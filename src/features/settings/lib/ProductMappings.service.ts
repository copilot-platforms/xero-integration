import type { ProductMapping } from '@items-sync/types'
import { and, eq, inArray, type SQL, sql } from 'drizzle-orm'
import z from 'zod'
import db from '@/db'
import { getTableFields } from '@/db/db.helpers'
import { syncedItems } from '@/db/schema/syncedItems.schema'
import SyncedItemsService from '@/features/items-sync/lib/SyncedItems.service'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ClientXeroItem } from '@/lib/xero/types'

/**
 * ProductMappingsService is a child class of SyncedItemsService that deals specifically with manually Synced items
 */
class ProductMappingsService extends AuthenticatedXeroService {
  async getClientXeroItems(): Promise<ClientXeroItem[]> {
    const xeroItems = await this.xero.getItems(this.connection.tenantId)
    return xeroItems.map((item) => ({
      itemID: z.string().parse(item.itemID),
      code: z.string().parse(item.code),
      name: item.name || '',
      amount: item.salesDetails?.unitPrice || 0,
    }))
  }

  async getProductMappings(): Promise<ProductMapping[]> {
    const syncedItemsService = new SyncedItemsService(this.user, this.connection)
    const mappingRecords = await syncedItemsService.getSyncedItemsMapByPriceIds('all')

    const xeroItems = await this.xero.getItemsMap(this.connection.tenantId)
    const copilotProducts = await this.copilot.getProductsMapById('all')
    const copilotPrices = await this.copilot.getPricesMapById('all')

    const mappings = Object.values(copilotPrices)
      // Sort by decreasing createdAt date
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      // Map each to distinct price, product & item objs
      .map((price) => {
        const item = mappingRecords[price.id] && xeroItems[price.id]
        return {
          price,
          product: copilotProducts[price.productId],
          item: item && {
            itemID: item.itemID,
            code: item.code,
            name: item.name,
            amount: item.salesDetails?.unitPrice || 0,
          },
        }
      })
      // Because the list endpoint could contain data for deleted products with hanging prices as well, remove them!
      .filter((obj) => obj.product)

    return mappings
  }

  async updateMappedItems(
    productMappings: { productId: string; priceId: string; itemId: string | null }[],
  ) {
    const sqlChunks: SQL[] = [sql`(CASE`]

    for (const map of productMappings) {
      sqlChunks.push(sql`WHEN ${syncedItems.priceId} = ${map.priceId} THEN ${map.itemId || 'NULL'}`)
    }
    const itemIdCases: SQL = sql.join(sqlChunks, sql.raw(' '))

    const mappings = await db
      .update(syncedItems)
      .set({ itemId: itemIdCases })
      .where(
        and(
          eq(syncedItems.portalId, this.user.portalId),
          eq(syncedItems.tenantId, this.connection.tenantId),
          inArray(
            syncedItems.priceId,
            productMappings.map((mapping) => mapping.priceId),
          ),
        ),
      )
      .returning(getTableFields(syncedItems, ['productId', 'priceId', 'itemId']))

    return mappings
  }
}

export default ProductMappingsService
