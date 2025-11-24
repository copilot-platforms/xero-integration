import status from 'http-status'
import type { Account } from 'xero-node'
import z from 'zod'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import { AccountCode } from '@/lib/xero/constants'

class SyncedAccountsService extends AuthenticatedXeroService {
  async getOrCreateCopilotExpenseAccount(): Promise<Account> {
    logger.info(
      'SyncedAccountsService#getOrCreateCopilotExpenseAccount :: Getting copilot expense account',
    )

    const accounts = await this.xero.getAccounts(this.connection.tenantId)
    let expenseAccount = accounts.find((acc) => acc.code === AccountCode.MERCHANT_FEES)

    // CASE I: Expense account exists
    if (expenseAccount) {
      if (!expenseAccount.enablePaymentsToAccount) {
        // CASE II: Expense account exists but payments are disabled
        await this.xero.makeAccountPaymentReceivable(
          this.connection.tenantId,
          z.string().parse(expenseAccount.accountID),
        )
      }
      logger.info(
        'SyncedAccountsService#getOrCreateCopilotExpenseAccount :: Created a new expense account:',
        expenseAccount,
      )

      return expenseAccount
    }

    // CASE III: Expense account doesn't exist
    expenseAccount = await this.xero.createExpenseAccount(this.connection.tenantId)
    if (!expenseAccount) {
      throw new APIError(
        'Failed to create a new expense account in xero',
        status.INTERNAL_SERVER_ERROR,
      )
    }

    logger.info(
      'SyncedAccountsService#getOrCreateCopilotExpenseAccount :: Created a new expense account:',
      expenseAccount,
    )

    return expenseAccount
  }
}

export default SyncedAccountsService
