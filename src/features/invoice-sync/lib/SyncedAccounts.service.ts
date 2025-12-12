import status from 'http-status'
import type { Account } from 'xero-node'
import z from 'zod'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import { AccountCode } from '@/lib/xero/constants'

class SyncedAccountsService extends AuthenticatedXeroService {
  async getOrCreateCopilotSalesAccount(): Promise<Account> {
    logger.info(
      'SyncedAccountsService#getOrCreateCopilotSalesAccount :: Getting copilot sales account',
    )

    const accounts = await this.xero.getAccounts(this.connection.tenantId)
    let salesAccount = accounts.find((acc) => acc.code === AccountCode.SALES)

    // CASE I: Sales account exists
    if (salesAccount) {
      if (!salesAccount.enablePaymentsToAccount) {
        // CASE II: Sales account exists but payments are disabled
        await this.xero.enablePaymentsForAccount(
          this.connection.tenantId,
          z.string().parse(salesAccount.accountID),
        )
      }
      logger.info(
        'SyncedAccountsService#getOrCreateCopilotSalesAccount :: Created a new sales account:',
        salesAccount,
      )

      return salesAccount
    }

    // CASE III: Sales account doesn't exist
    salesAccount = await this.xero.createSalesAccount(this.connection.tenantId)
    if (!salesAccount) {
      throw new APIError(
        'Failed to create a new sales account in xero',
        status.INTERNAL_SERVER_ERROR,
      )
    }

    logger.info(
      'SyncedAccountsService#getOrCreateCopilotSalesAccount :: Created a new sales account:',
      salesAccount,
    )

    return salesAccount
  }

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
        await this.xero.enablePaymentsForAccount(
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

  async getOrCreateCopilotAssetAccount(): Promise<Account> {
    logger.info(
      'SyncedAccountsService#getOrCreateCopilotAssetAccount :: Getting copilot asset account',
    )

    const accounts = await this.xero.getAccounts(this.connection.tenantId, 'BANK')
    let assetAccount = accounts.find((acc) => acc.code === AccountCode.BANK)

    // NOTE: We don't have the 'enablePaymentsToAccount' prop in Bank type accounts
    if (!assetAccount) {
      assetAccount = await this.xero.createFixedAssetsAccount(this.connection.tenantId)
      if (!assetAccount) {
        throw new APIError(
          'Failed to create a new asset account in xero',
          status.INTERNAL_SERVER_ERROR,
        )
      }

      logger.info(
        'SyncedAccountsService#getOrCreateCopilotAssetAccount :: Created a new asset account:',
        assetAccount,
      )
    }

    logger.info(
      'SyncedAccountsService#getOrCreateCopilotAssetAccount :: Using asset account:',
      assetAccount,
    )

    return assetAccount
  }
}

export default SyncedAccountsService
