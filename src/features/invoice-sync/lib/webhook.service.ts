import 'server-only'

import SyncedInvoicesService from '@invoice-sync/lib/SyncedInvoices.service'
import { InvoiceCreatedEventSchema, type WebhookEvent } from '@invoice-sync/types'
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

    const eventHandlerMap: Record<
      WebhookEvent['eventType'],
      (eventData: WebhookEvent['data']) => object
    > = {
      'invoice.created': this.handleInvoiceCreated,
    }
    const handler = eventHandlerMap[data.eventType]
    return await handler(data.data)
  }

  private handleInvoiceCreated = async (eventData: WebhookEvent['data']) => {
    const data = await InvoiceCreatedEventSchema.parse(eventData)

    if (data.status === 'draft') {
      throw new APIError(`Ignoring draft invoice ${eventData.id}`, status.OK)
    }

    const xeroInvoiceSyncService = new SyncedInvoicesService(this.user, this.connection)
    return await xeroInvoiceSyncService.syncInvoiceToXero(data)
  }
}

export default WebhookService
