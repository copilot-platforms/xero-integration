import 'server-only'

import SyncedContactsService from '@invoice-sync/lib/SyncedContacts.service'
import { serializeLineItems } from '@invoice-sync/lib/serializers'
import type { InvoiceCreatedEvent } from '@invoice-sync/types'
import { and, eq, inArray } from 'drizzle-orm'
import status from 'http-status'
import { Invoice, type Item } from 'xero-node'
import z from 'zod'
import db from '@/db'
import { type SyncedInvoiceCreatePayload, syncedInvoices } from '@/db/schema/syncedInvoices.schema'
import { syncedItems } from '@/db/schema/syncedItems.schema'
import APIError from '@/errors/APIError'
import SyncedTaxRatesService from '@/features/invoice-sync/lib/SyncedTaxRates.service'
import CopilotProductsService from '@/lib/copilot/services/CopilotProducts.service'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import {
  CreateInvoicePayloadSchema,
  type CreateInvoicePayload as InvoiceCreatePayload,
} from '@/lib/xero/types'
import { datetimeToDate } from '@/utils/date'
import { htmlToText } from '@/utils/html'

class SyncedInvoicesService extends AuthenticatedXeroService {
  async syncInvoiceToXero(data: InvoiceCreatedEvent): Promise<{
    copilotInvoiceId: string
    xeroInvoiceId: string | null
    status: SyncedInvoiceCreatePayload['status']
  }> {
    const taxRatePromise = this.getTaxRate(data)
    const contactPromise = this.getContact(data)
    const productsWithPricePromise = this.getProductsWithPrice(data)

    const [taxRate, { contactID }, productsWithPrice] = await Promise.all([
      taxRatePromise,
      contactPromise,
      productsWithPricePromise,
    ])

    const lineItems = serializeLineItems(data.lineItems, productsWithPrice, taxRate)

    // Prepare invoice creation payload
    const invoice = CreateInvoicePayloadSchema.parse({
      type: Invoice.TypeEnum.ACCREC,
      invoiceNumber: data.number,
      contact: { contactID },
      dueDate: datetimeToDate(data.dueDate),
      lineItems,
      status: Invoice.StatusEnum.AUTHORISED,
      date: datetimeToDate(data.sentDate),
    } satisfies InvoiceCreatePayload)

    // Add a "pending" invoice to db
    let syncedInvoiceRecord = await this.getOrCreateInvoiceRecord(data)
    if (syncedInvoiceRecord.status === 'success') {
      logger.info(
        `XeroInvoiceSyncService#syncInvoiceToXero :: Ignoring ${syncedInvoiceRecord.status} sync`,
      )
      return syncedInvoiceRecord
    }

    let syncedInvoice: Invoice | undefined
    // Create and save invoice status
    try {
      syncedInvoice = await this.xero.createInvoice(this.connection.tenantId, invoice)
      syncedInvoiceRecord = await this.updateInvoiceRecord(
        data,
        syncedInvoice,
        syncedInvoice ? 'success' : 'failed',
      )
    } catch (e: unknown) {
      syncedInvoiceRecord = await this.updateInvoiceRecord(data, undefined, 'failed')
      throw new APIError('Failed to store synced invoice record', status.INTERNAL_SERVER_ERROR, e)
    }

    logger.info(
      `XeroInvoiceSyncService#syncInvoiceToXero :: Synced Copilot invoice ${syncedInvoiceRecord.copilotInvoiceId} (${syncedInvoice?.invoiceNumber}) to Xero invoice ${syncedInvoiceRecord.xeroInvoiceId} for portalId ${this.connection.portalId}`,
    )
    return syncedInvoiceRecord
  }

  private async getTaxRate(data: InvoiceCreatedEvent) {
    const xeroTaxService = new SyncedTaxRatesService(this.user, this.connection)
    return data.taxAmount ? await xeroTaxService.getTaxRateForItem(data.taxPercentage) : undefined
  }

  private async getContact(data: InvoiceCreatedEvent) {
    const xeroContactService = new SyncedContactsService(this.user, this.connection)
    return await xeroContactService.getSyncedContact(data.clientId)
  }

  private async getProductsWithPrice(data: InvoiceCreatedEvent) {
    const copilotProductsService = new CopilotProductsService(this.user)

    // Get existing products & prices
    const lineProductIds = [],
      linePriceIds = []
    for (const item of data.lineItems) {
      item.productId && lineProductIds.push(item.productId)
      item.priceId && linePriceIds.push(item.priceId)
    }
    const products = await copilotProductsService.getCopilotProducts(lineProductIds)
    const prices = await copilotProductsService.getCopilotPrices(linePriceIds)

    // Get all synced items from db
    const syncedXeroItems = await db
      // .select(getSelectFields(syncedItems, ['productId', 'priceId', 'itemId']))
      .select({
        productId: syncedItems.productId,
        priceId: syncedItems.priceId,
        itemId: syncedItems.itemId,
      })
      .from(syncedItems)
      .where(
        and(
          eq(syncedItems.portalId, this.user.portalId),
          inArray(syncedItems.priceId, Object.keys(prices)),
        ),
      )

    // Object with key as priceId (guarenteed to be unique), and value as xero item
    const syncedXeroItemsMap: Record<string, string> = {}

    const itemsToCreate: Item[] = []
    for (const item of data.lineItems) {
      // CASE I: If product is a one-off item (without productId or priceId, skip it)
      if (!item.productId || !item.priceId) continue

      const copilotProduct = products[item.productId]
      const copilotPrice = prices[item.priceId]
      logger.info(
        'XeroInvoiceSyncService#getProductsWithPrice :: Found product and price for lineItem',
        item.description,
        {
          copilotProduct,
          copilotPrice,
        },
      )

      // CASE II: For line item with productId & priceId, if synced product exists use it
      const syncedRecord = syncedXeroItems.find(
        (i) => i.productId === item.productId && i.priceId === item.priceId,
      )
      if (syncedRecord) {
        syncedXeroItemsMap[copilotPrice.id] = syncedRecord.itemId
      } else {
        // CASE III: If synced product doesn't exist, schedule to create it
        itemsToCreate.push({
          code: item.priceId, // Use priceID as item code since it is the only guarenteed unique identifier here
          name: copilotProduct.name,
          description: htmlToText(copilotProduct.description),
          salesDetails: {
            unitPrice: copilotPrice.amount,
          },
        })
      }
    }

    logger.info(
      'XeroInvoiceService#getProductsWithPrice :: Did not find synced items. Creating new items and syncing them...',
      itemsToCreate,
    )

    if (itemsToCreate.length) {
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
      for (const item of newlyCreatedItems) {
        syncedXeroItemsMap[item.code] = z.string().parse(item.itemID)
      }
    }

    return syncedXeroItemsMap
  }

  private async getOrCreateInvoiceRecord(
    data: InvoiceCreatedEvent,
    syncedInvoice?: Invoice,
    status?: SyncedInvoiceCreatePayload['status'], // allow db to default to 'pending'
  ) {
    // const selectFields = getSelectFields(syncedInvoices, [
    //   'copilotInvoiceId',
    //   'xeroInvoiceId',
    //   'status',
    // ])
    const selectFields = {
      copilotInvoiceId: syncedInvoices.copilotInvoiceId,
      xeroInvoiceId: syncedInvoices.xeroInvoiceId,
      status: syncedInvoices.status,
    } as const

    const prevInvoices = await db
      .select(selectFields)
      .from(syncedInvoices)
      .where(
        and(
          eq(syncedInvoices.portalId, this.user.portalId),
          eq(syncedInvoices.copilotInvoiceId, data.id),
        ),
      )
    if (prevInvoices[0]) return prevInvoices[0]

    const [invoice] = await db
      .insert(syncedInvoices)
      .values({
        portalId: this.user.portalId,
        tenantId: this.connection.tenantId,
        copilotInvoiceId: data.id,
        xeroInvoiceId: syncedInvoice?.invoiceID,
        status,
      })
      .returning(selectFields)
    return invoice
  }

  private async updateInvoiceRecord(
    data: InvoiceCreatedEvent,
    syncedInvoice?: Invoice,
    status?: SyncedInvoiceCreatePayload['status'],
  ) {
    const [invoice] = await db
      .update(syncedInvoices)
      .set({
        xeroInvoiceId: syncedInvoice?.invoiceID,
        portalId: this.user.portalId,
        tenantId: this.connection.tenantId,
        status,
      })
      .where(
        and(
          eq(syncedInvoices.portalId, this.user.portalId),
          eq(syncedInvoices.copilotInvoiceId, data.id),
        ),
      )
      .returning({
        copilotInvoiceId: syncedInvoices.copilotInvoiceId,
        xeroInvoiceId: syncedInvoices.xeroInvoiceId,
        status: syncedInvoices.status,
      })
    return invoice
  }
}

export default SyncedInvoicesService
