import 'server-only'

import XeroInvoiceSyncService from '@invoice-sync/lib/SyncedInvoices.service'
import {
  InvoiceCreatedEventSchema,
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

    const eventHandlerMap: Record<WebhookEvent['eventType'], (data: unknown) => Promise<object>> = {
      [ValidWebhookEvent.InvoiceCreated]: this.handleInvoiceCreated,
      [ValidWebhookEvent.ProductUpdated]: this.handleProductUpdated,
      [ValidWebhookEvent.PriceCreated]: this.handlePriceCreated,
    }
    const handler = eventHandlerMap[data.eventType]
    return await handler(data.data)
  }

  private handleInvoiceCreated = async (eventData: unknown) => {
    const data = InvoiceCreatedEventSchema.parse(eventData)
    if (data.status === 'draft') {
      throw new APIError(`Ignoring draft invoice ${data.id}`, status.OK)
    }

    const xeroInvoiceSyncService = new XeroInvoiceSyncService(this.user, this.connection)
    return await xeroInvoiceSyncService.syncInvoiceToXero(data)
  }

  private handleProductUpdated = async (eventData: unknown) => {
    const { id, name, description } = ProductUpdatedEventSchema.parse(eventData)
    const syncedItemsService = new SyncedItemsService(this.user, this.connection)
    const payload = {
      name,
      description: htmlToText(description),
    } satisfies ItemUpdatePayload

    const items = await syncedItemsService.updateXeroItemsForProductId(
      id,
      ItemUpdatePayloadSchema.parse(payload),
    )
    return { items }
  }

  private handlePriceCreated = async (eventData: unknown) => {
    const data = PriceCreatedEventSchema.parse(eventData)

    const syncedItemsService = new SyncedItemsService(this.user, this.connection)
    return await syncedItemsService.createItemForPrice(data)
  }
}

export default WebhookService
