import 'server-only'

import SyncedInvoicesService from '@invoice-sync/lib/SyncedInvoices.service'
import {
  type InvoiceCreatedEvent,
  type PriceCreatedEvent,
  type ProductUpdatedEvent,
  ValidWebhookEvent,
  type WebhookEvent,
} from '@invoice-sync/types'
import status from 'http-status'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'

class WebhookService extends AuthenticatedXeroService {
  async handleEvent(data: WebhookEvent) {
    logger.info(
      'WebhookService#handleEvent :: Handling webhook for user',
      this.user.portalId,
      this.user.token,
    )
    logger.info('WebhookService#handleEvent :: Received webhook event data', data)

    const eventHandlerMap = {
      [ValidWebhookEvent.InvoiceCreated]: this.handleInvoiceCreated,
      [ValidWebhookEvent.ProductUpdated]: this.handleProductUpdated,
      [ValidWebhookEvent.PriceCreated]: this.handlePriceCreated,
    }
    const handler = eventHandlerMap[data.eventType]
    if (!handler) {
      throw new APIError(`No handler for event type ${data.eventType}`, status.BAD_REQUEST)
    }
    // biome-ignore lint/suspicious/noExplicitAny: data arg is typesafe, trust me bro
    return await handler(data.data as any)
  }

  private handleInvoiceCreated = async (data: InvoiceCreatedEvent) => {
    if (data.status === 'draft') {
      throw new APIError(`Ignoring draft invoice ${data.id}`, status.OK)
    }
    const xeroInvoiceSyncService = new SyncedInvoicesService(this.user, this.connection)
    return await xeroInvoiceSyncService.syncInvoiceToXero(data)
  }

  private handleProductUpdated = async (data: ProductUpdatedEvent) => {
    logger.info(data)
    return await {}
  }

  private handlePriceCreated = async (data: PriceCreatedEvent) => {
    logger.info(data)
    return await {}
  }
}

export default WebhookService
