import SyncedAccountsService from '@invoice-sync/lib/SyncedAccounts.service'
import type { PaymentSucceededEvent } from '@invoice-sync/types'
import { and, eq } from 'drizzle-orm'
import status from 'http-status'
import type { Payment } from 'xero-node'
import { type SyncedPayment, syncedPayments } from '@/db/schema/syncedPayments.schema'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'

class SyncedPaymentsService extends AuthenticatedXeroService {
  async getPaymentForInvoiceId(copilotInvoiceId: string) {
    const results = await this.db
      .select()
      .from(syncedPayments)
      .where(
        and(
          eq(syncedPayments.portalId, this.user.portalId),
          eq(syncedPayments.tenantId, this.connection.tenantId),
          eq(syncedPayments.copilotInvoiceId, copilotInvoiceId),
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
  ) {
    logger.info('SyncedPaymentsService#createPayment :: Creating payment for payload', data)

    await this.db.insert(syncedPayments).values({
      portalId: this.user.portalId,
      tenantId: this.connection.tenantId,
      ...data,
    })
  }

  async createPlatformExpensePayment(data: PaymentSucceededEvent): Promise<Payment> {
    logger.info(
      'SyncedPaymentsService#createPlatformExpensePayment :: Creating platform expense payment for',
    )

    const accountsService = new SyncedAccountsService(this.user, this.connection)
    const expenseAccount = await accountsService.getOrCreateCopilotExpenseAccount()
    const payment = await this.xero.createExpensePayment(
      this.connection.tenantId,
      data.invoiceId,
      expenseAccount,
      data.feeAmount.paidByPlatform,
    )
    if (!payment) {
      throw new APIError('Failed to create expense payment', status.INTERNAL_SERVER_ERROR)
    }

    logger.info(
      'SyncedPaymentsService#createPlatformExpensePayment :: Created platform expense payment',
      payment,
    )
    return payment
  }
}

export default SyncedPaymentsService
