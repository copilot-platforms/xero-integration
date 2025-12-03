// Ref: https://www.xero.com/glossary/chart-of-accounts/
// Ref: https://www.cubesoftware.com/blog/chart-of-accounts
export enum AccountCode {
  SALES = '4000', // This tracks income generated from business operations, like sales revenue for both products & services
  BANK = '2001',
  MERCHANT_FEES = '6041',
}

// Ref: https://developer.xero.com/documentation/api/accounting/types#report-tax-types
export enum ReportTaxType {
  OUTPUT = 'OUTPUT',
}

export const SALES_ACCOUNT_NAME = 'Sales of Goods' // Mirrors Xero's default sales account name  & behavior
export const EXPENSE_ACCOUNT_NAME = 'Assembly Processing Fees'
export const ASSET_ACCOUNT_NAME = 'Assembly Asset Account'
