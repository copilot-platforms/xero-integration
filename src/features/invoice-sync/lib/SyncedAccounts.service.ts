import status from 'http-status'
import { type Account, AccountType } from 'xero-node'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'

class SyncedAccountsService extends AuthenticatedXeroService {
  async getOrCreateCopilotExpenseAccount(): Promise<Account> {
    logger.info(
      'SyncedAccountsService#getOrCreateCopilotExpenseAccount :: Getting copilot expense account',
    )

    const accounts = await this.xero.getAccounts(this.connection.tenantId)
    let expenseAccount = accounts.find((acc) => acc.type === AccountType.EXPENSE)
    if (!expenseAccount) {
      expenseAccount = await this.xero.createExpenseAccount(this.connection.tenantId)
      if (!expenseAccount) {
        throw new APIError(
          'Failed to create a new expense account in xero',
          status.INTERNAL_SERVER_ERROR,
        )
      }
    }

    logger.info(
      'SyncedAccountsService#getOrCreateCopilotExpenseAccount :: Found expense account:',
      expenseAccount,
    )

    return expenseAccount
  }
}

export default SyncedAccountsService
