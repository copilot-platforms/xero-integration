import { type Account, AccountType } from 'xero-node'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'

class SyncedAccountsService extends AuthenticatedXeroService {
  async getOrCreateCopilotExpenseAccount(): Promise<Account[]> {
    logger.info(
      'SyncedAccountsService#getOrCreateCopilotExpenseAccount :: Getting copilot expense account',
    )

    const accounts = await this.xero.getAccounts(this.connection.tenantId)
    const expenseAccount = accounts.find((acc) => acc.type === AccountType.EXPENSE)
    if (expenseAccount) {
      logger.info(
        'SyncedAccountsService#getOrCreateCopilotExpenseAccount :: Found expense account:',
        expenseAccount,
      )
    } else {
      await this.xero.createExpenseAccount(this.connection.tenantId)
    }
    return accounts
  }
}

export default SyncedAccountsService
