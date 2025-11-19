import 'server-only'

import FailedSyncsService from '@failed-syncs/lib/FailedSyncs.service'
import XeroInvoiceSyncService from '@invoice-sync/lib/SyncedInvoices.service'
import {
  InvoiceCreatedEventSchema,
  InvoiceModifiedEventSchema,
  PriceCreatedEventSchema,
  ProductUpdatedEventSchema,
  ValidWebhookEvent,
  type WebhookEvent,
} from '@invoice-sync/types'
import SyncedItemsService from '@items-sync/lib/SyncedItems.service'
import status from 'http-status'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import { type ItemUpdatePayload, ItemUpdatePayloadSchema } from '@/lib/xero/types'
import { htmlToText } from '@/utils/html'

class WebhookService extends AuthenticatedXeroService {
  async handleEvent(data: WebhookEvent) {
    logger.info(
      'WebhookService#handleEvent :: Handling webhook for user',
      this.user.portalId,
      this.user.token,
    )
    logger.info('WebhookService#handleEvent :: Received webhook event data', data)

    const eventHandlerMap: Record<
      WebhookEvent['eventType'],
      (data: unknown) => Promise<object> | Promise<void>
    > = {
      [ValidWebhookEvent.InvoiceCreated]: this.handleInvoiceCreated,
      [ValidWebhookEvent.InvoicePaid]: this.handleInvoicePaid,
      [ValidWebhookEvent.InvoiceVoided]: this.handleInvoiceVoided,
      [ValidWebhookEvent.InvoiceDeleted]: this.handleInvoiceDeleted,
      [ValidWebhookEvent.ProductUpdated]: this.handleProductUpdated,
      [ValidWebhookEvent.PriceCreated]: this.handlePriceCreated,
    }

    const handler = eventHandlerMap[data.eventType]
    try {
      return await handler(data.data)
    } catch (e: unknown) {
      const failedSyncsService = new FailedSyncsService(this.user)
      await failedSyncsService.addFailedSyncRecord(
        this.connection.tenantId,
        data.eventType,
        data.data,
      )
      throw e
    }
  }

  private handleInvoiceCreated = async (eventData: unknown) => {
    logger.info('WebhookService#handleInvoiceCreated :: Handling invoice created')

    const data = InvoiceCreatedEventSchema.parse(eventData)
    if (data.status === 'draft') {
      throw new APIError(`Ignoring draft invoice ${data.id}`, status.OK)
    }
    const xeroInvoiceSyncService = new XeroInvoiceSyncService(this.user, this.connection)
    return await xeroInvoiceSyncService.syncInvoiceToXero(data)
  }

  private handleInvoicePaid = async (eventData: unknown) => {
    await logger.info('WebhookService#handleInvoicePaid :: Handling invoice paid')

    const data = InvoiceModifiedEventSchema.parse(eventData)
    const invoiceSyncService = new XeroInvoiceSyncService(this.user, this.connection)
    return await invoiceSyncService.syncPaidInvoiceToXero(data.id)
  }

  private handleInvoiceVoided = async (eventData: unknown) => {
    await logger.info('WebhookService#handleInvoiceVoided :: Handling invoice voided')

    const data = InvoiceModifiedEventSchema.parse(eventData)
    // TODO: in next ticket
    return data
  }

  private handleInvoiceDeleted = async (eventData: unknown) => {
    await logger.info('WebhookService#handleInvoiceDeleted :: Handling invoice deleted')

    const data = InvoiceModifiedEventSchema.parse(eventData)
    // TODO: in next ticket
    return data
  }

  private handleProductUpdated = async (eventData: unknown) => {
    logger.info('handleProductUpdated :: Handling product updated for data')

    const { id, name, description } = ProductUpdatedEventSchema.parse(eventData)
    const syncedItemsService = new SyncedItemsService(this.user, this.connection)
    const payload = {
      name,
      description: htmlToText(description),
    } satisfies ItemUpdatePayload

    const items = await syncedItemsService.updateSyncedItemsForProductId(
      id,
      ItemUpdatePayloadSchema.parse(payload),
    )
    return { items }
  }

  private handlePriceCreated = async (eventData: unknown) => {
    logger.info('WebhookService#handleInvoiceCreated :: Handling price created')

    const data = PriceCreatedEventSchema.parse(eventData)
    const syncedItemsService = new SyncedItemsService(this.user, this.connection)
    const [newPrice] = await syncedItemsService.createSyncedItemsForPrices([data])
    return newPrice
  }
}

export default WebhookService
