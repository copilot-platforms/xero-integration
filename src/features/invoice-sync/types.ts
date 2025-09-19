import z from 'zod'

export const WebhookTokenSchema = z.object({
  workspaceId: z.string().min(1),
})
export type WebhookToken = z.infer<typeof WebhookTokenSchema>

export const InvoiceCreatedEventSchema = z.object({
  clientId: z.uuid(),
  companyId: z.uuid(),
  collectionMethod: z.enum(['sendInvoice']),
  createdAt: z.iso.datetime(),
  currency: z.string(),
  dueDate: z.iso.datetime(),
  fileUrl: z.string(),
  id: z.string(),
  lineItems: z.array(
    z.object({
      amount: z.number(),
      description: z.string(),
      quantity: z.number(),
      priceId: z.string().optional(),
      productId: z.uuid().optional(),
    }),
  ),
  memo: z.string(),
  number: z.string(),
  sentDate: z.iso.datetime(),
  status: z.enum(['open', 'draft']),
  taxAmount: z.number(),
  taxPercentage: z.number(),
  total: z.number(),
  updatedAt: z.iso.datetime(),
})
export type InvoiceCreatedEvent = z.infer<typeof InvoiceCreatedEventSchema>

export const ProductUpdatedEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})
export type ProductUpdatedEvent = z.infer<typeof ProductUpdatedEventSchema>

export const PriceCreatedEventSchema = z.object({
  id: z.string(),
  productId: z.string(),
  amount: z.number(),
})
export type PriceCreatedEvent = z.infer<typeof PriceCreatedEventSchema>

export enum ValidWebhookEvent {
  InvoiceCreated = 'invoice.created',
  ProductUpdated = 'product.updated',
  PriceCreated = 'price.created',
}

export const InvoiceCreatedWebhookSchema = z.object({
  eventType: z.literal(ValidWebhookEvent.InvoiceCreated),
  data: InvoiceCreatedEventSchema,
})
export type InvoiceCreatedWebhook = z.infer<typeof InvoiceCreatedWebhookSchema>

export const ProductUpdatedWebhookSchema = z.object({
  eventType: z.literal(ValidWebhookEvent.ProductUpdated),
  data: ProductUpdatedEventSchema,
})
export type ProductUpdatedWebhook = z.infer<typeof ProductUpdatedWebhookSchema>

export const PriceCreatedWebhookSchema = z.object({
  eventType: z.literal(ValidWebhookEvent.PriceCreated),
  data: PriceCreatedEventSchema,
})
export type PriceCreatedWebhook = z.infer<typeof PriceCreatedWebhookSchema>

export const WebhookEventSchema = z.discriminatedUnion('eventType', [
  InvoiceCreatedWebhookSchema,
  ProductUpdatedWebhookSchema,
  PriceCreatedWebhookSchema,
])
export type WebhookEvent = z.infer<typeof WebhookEventSchema>
