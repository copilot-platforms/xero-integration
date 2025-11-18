import { calculateTaxAmount } from '@invoice-sync/lib/utils'
import type { InvoiceCreatedEvent } from '@invoice-sync/types'
import type { TaxRate, LineItem as XeroLineItem } from 'xero-node'
import type { ClientResponse } from '@/lib/copilot/types'
import logger from '@/lib/logger'
import { AccountCode } from '@/lib/xero/constants'
import {
  type ContactCreatePayload,
  ContactCreatePayloadSchema,
  type LineItem,
  LineItemSchema,
} from '@/lib/xero/types'

export const serializeLineItems = (
  copilotItems: InvoiceCreatedEvent['lineItems'],
  priceIdToXeroItem: Record<string, XeroLineItem>,
  taxRate?: TaxRate,
): LineItem[] => {
  logger.info('invoice-sync/lib/serializers#serializeLineItems :: Serializing line items:', {
    copilotItems,
    priceIdToXeroItem,
    taxRate,
  })
  const xeroLineItems: LineItem[] = []
  for (const item of copilotItems) {
    if (!item.priceId) continue

    const xeroItem = priceIdToXeroItem[item.priceId]
    if (!xeroItem) {
      logger.warn(
        'serializeLineItems :: No Xero item found for priceId:',
        item.priceId,
        'Skipping until checkbox implementation.',
      )
      continue
    }

    const payload = {
      // NOTE: Both lineItemID and itemCode need to be provided for an invoice item to map to an item in Xero
      // Ref: https://developer.xero.com/documentation/api/accounting/invoices#post-invoices
      // See section on LineItems elements
      lineItemID: xeroItem.lineItemID,
      itemCode: xeroItem.itemCode,
      description: item.description,
      unitAmount: item.amount / 100,
      quantity: item.quantity,
      taxAmount: calculateTaxAmount(item.amount, item.quantity, taxRate?.effectiveRate),
      taxType: taxRate?.taxType,
      accountCode: AccountCode.SALES,
    } satisfies XeroLineItem
    xeroLineItems.push(LineItemSchema.parse(payload))
  }

  return xeroLineItems
}

export const serializeContact = (client: ClientResponse): ContactCreatePayload => {
  return ContactCreatePayloadSchema.parse({
    name: `${client.givenName} ${client.familyName}`,
    firstName: client.givenName,
    lastName: client.familyName,
    emailAddress: client.email,
  } satisfies ContactCreatePayload)
}
