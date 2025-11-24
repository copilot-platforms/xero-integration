import SyncedAccountsService from '@invoice-sync/lib/SyncedAccounts.service'
import SyncedInvoicesService from '@invoice-sync/lib/SyncedInvoices.service'
import type { PaymentSucceededEvent } from '@invoice-sync/types'
import { and, eq } from 'drizzle-orm'
import status from 'http-status'
import { Invoice, type Payment } from 'xero-node'
import z from 'zod'
import {
  PaymentUserType,
  type SyncedPayment,
  syncedPayments,
} from '@/db/schema/syncedPayments.schema'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import { AccountCode } from '@/lib/xero/constants'
import { type CreateInvoicePayload, CreateInvoicePayloadSchema } from '@/lib/xero/types'
import { datetimeToDate } from '@/utils/date'

class SyncedPaymentsService extends AuthenticatedXeroService {
  async getPaymentForInvoiceId(copilotInvoiceId: string) {
    logger.info(
      'SyncedPaymentsService#createPayment :: Getting payment data from db for',
      copilotInvoiceId,
    )

    const results = await this.db
      .select()
      .from(syncedPayments)
      .where(
        and(
          eq(syncedPayments.portalId, this.user.portalId),
          eq(syncedPayments.tenantId, this.connection.tenantId),
          eq(syncedPayments.copilotInvoiceId, copilotInvoiceId),
          eq(syncedPayments.type, PaymentUserType.PAYMENT),
        ),
      )
    logger.info('SyncedPaymentsService#getPaymentForInvoiceId :: Fetched payment', results[0])

    return results.length ? results[0] : undefined
  }

  async createPaymentRecord(
    data: Pick<
      SyncedPayment,
      'copilotInvoiceId' | 'copilotPaymentId' | 'xeroInvoiceId' | 'xeroPaymentId'
    >,
    type?: PaymentUserType,
  ) {
    logger.info('SyncedPaymentsService#createPayment :: Creating payment for payload', data)

    await this.db.insert(syncedPayments).values({
      portalId: this.user.portalId,
      tenantId: this.connection.tenantId,
      ...data,
      type,
    })
  }

  async createPlatformExpensePayment(data: PaymentSucceededEvent): Promise<Payment> {
    logger.info(
      'SyncedPaymentsService#createPlatformExpensePayment :: Creating platform expense payment for',
    )

    const invoicesService = new SyncedInvoicesService(this.user, this.connection)
    const { invoice } = await invoicesService.getValidatedInvoiceRecord(data.invoiceId)

    const accountsService = new SyncedAccountsService(this.user, this.connection)
    const expenseAccount = await accountsService.getOrCreateCopilotExpenseAccount()

    // Create an expense invoice
    const expenseInvoiceDetails = CreateInvoicePayloadSchema.parse({
      type: Invoice.TypeEnum.ACCREC,
      invoiceNumber: `${invoice.invoiceNumber}-EXP`,
      contact: { contactID: invoice.contact?.contactID },
      dueDate: datetimeToDate(invoice.dueDate as string), // Due date must always be present for an invoice
      lineItems: [
        {
          accountCode: AccountCode.MERCHANT_FEES,
          description: `Assembly Processing Fees for ${invoice.invoiceNumber}`,
          quantity: 1,
          taxAmount: 0,
          unitAmount: data.feeAmount.paidByPlatform / 100,
        },
      ],
      status: Invoice.StatusEnum.AUTHORISED,
      date: datetimeToDate(new Date().toISOString()),
    } satisfies CreateInvoicePayload)

    const expenseInvoice = await this.xero.createInvoice(
      this.connection.tenantId,
      expenseInvoiceDetails,
    )

    // Create an expense payment linked to this expense invoice
    const payment = await this.xero.createExpensePayment(
      this.connection.tenantId,
      z.string().parse(expenseInvoice?.invoiceID),
      expenseAccount,
      data.feeAmount.paidByPlatform / 100,
      invoice.invoiceID,
    )
    if (!payment) {
      throw new APIError('Failed to create expense payment', status.INTERNAL_SERVER_ERROR)
    }
    logger.info(
      'SyncedPaymentsService#createPlatformExpensePayment :: Created expense payment',
      payment,
    )

    // Log payment to DB as an expense
    await this.createPaymentRecord(
      {
        copilotInvoiceId: data.invoiceId,
        xeroInvoiceId: z.string().parse(invoice.invoiceID),
        xeroPaymentId: z.string().parse(payment.paymentID),
        copilotPaymentId: data.id,
      },
      PaymentUserType.EXPENSE,
    )

    logger.info(
      'SyncedPaymentsService#createPlatformExpensePayment :: Created platform expense payment',
      payment,
    )
    return payment
  }
}

export default SyncedPaymentsService
