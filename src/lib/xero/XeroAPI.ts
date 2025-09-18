import 'server-only'

import status from 'http-status'
import { type Invoice, type Item, type TaxRate, type TokenSet, XeroClient } from 'xero-node'
import z from 'zod'
import env from '@/config/server.env'
import APIError from '@/errors/APIError'
import logger from '@/lib/logger'
import type {
  ContactCreatePayload,
  CreateInvoicePayload,
  TaxRateCreatePayload,
  ValidContact,
} from '@/lib/xero/types'
import { getServerUrl } from '@/utils/serverUrl'

class XeroAPI {
  private readonly xero: XeroClient

  constructor() {
    this.xero = new XeroClient({
      clientId: env.XERO_CLIENT_ID,
      clientSecret: env.XERO_CLIENT_SECRET,
      redirectUris: [env.XERO_CALLBACK_URL],
      scopes: env.XERO_SCOPES.split(' '),
    })
  }

  /**
   * Build the consent URL to redirect users to Xero's authorization page
   * using Xero OAuth app's clientId, clientScret, redirectUri, and scopes
   */
  async buildConsentUrl(): Promise<string> {
    return await this.xero.buildConsentUrl()
  }

  /**
   * Refreshes a Xero access token with a set refresh token
   */
  async refreshWithRefreshToken(refreshToken: string): Promise<TokenSet> {
    return await this.xero.refreshWithRefreshToken(
      env.XERO_CLIENT_ID,
      env.XERO_CLIENT_SECRET,
      refreshToken,
    )
  }

  /**
   * Handle API callback from Xero and exchange the authorization code
   */
  async handleApiCallback(searchParams: {
    [key: string]: string | string[] | undefined
  }): ReturnType<XeroClient['apiCallback']> {
    try {
      const url = await getServerUrl('/auth/callback', await searchParams)
      const tokenSet = await this.xero.apiCallback(url)
      return tokenSet
    } catch (error) {
      logger.error('XeroAPI#handleApiCallback | Error during API callback:', error)
      throw error
    }
  }

  /**
   * Sets active tokenset for Xero SDK authorization
   * @param tokenSet
   */
  setTokenSet(tokenSet: TokenSet) {
    this.xero.setTokenSet(tokenSet)
  }

  /**
   * Gets the active (most recently connected) tenant (organization) for
   * @returns Active Tenant's tenantId
   */
  async getActiveTenantId(): Promise<string> {
    const connections = await this.xero.updateTenants(false) // Get an updated set of tenants
    return connections[0].tenantId
  }

  async createInvoice(
    tenantId: string,
    invoice: CreateInvoicePayload,
  ): Promise<Invoice | undefined> {
    // Ref: https://developer.xero.com/documentation/api/accounting/invoices#post-invoices
    const { body } = await this.xero.accountingApi.createInvoices(
      tenantId,
      { invoices: [invoice] },
      true,
    )
    return body.invoices?.[0]
  }

  async getContact(tenantId: string, contactId: string): Promise<ValidContact | undefined> {
    const { body } = await this.xero.accountingApi.getContact(tenantId, contactId)
    const contact = body.contacts?.[0]
    if (contact) {
      return { ...contact, contactID: z.uuid().parse(contact.contactID) }
    }
  }

  async createContact(tenantId: string, contact: ContactCreatePayload): Promise<ValidContact> {
    const { body } = await this.xero.accountingApi.createContacts(
      tenantId,
      { contacts: [contact] },
      true,
    )
    const newContact = body.contacts?.[0]

    if (!newContact) throw new APIError('Unable to create contact', status.INTERNAL_SERVER_ERROR)

    return { ...newContact, contactID: z.uuid().parse(newContact.contactID) }
  }

  async updateContact(tenantId: string, contact: ValidContact): Promise<ValidContact> {
    const { body } = await this.xero.accountingApi.updateContact(tenantId, contact.contactID, {
      contacts: [contact],
    })
    const newContact = body.contacts?.[0]

    if (!newContact) throw new APIError('Unable to update contact', status.INTERNAL_SERVER_ERROR)

    return { ...newContact, contactID: z.uuid().parse(newContact.contactID) }
  }

  async getTaxRates(tenantId: string) {
    const { body } = await this.xero.accountingApi.getTaxRates(tenantId)
    return body.taxRates
  }

  async createTaxRate(tenantId: string, taxRate: TaxRateCreatePayload): Promise<TaxRate> {
    const { body } = await this.xero.accountingApi.createTaxRates(tenantId, { taxRates: [taxRate] })
    const newTaxRate = body.taxRates?.[0]

    if (!newTaxRate) throw new APIError('Unable to create taxRate', status.INTERNAL_SERVER_ERROR)
    return newTaxRate
  }

  async createItems(tenantId: string, items: Item[]): Promise<Item[]> {
    if (!items.length) return []

    const { body } = await this.xero.accountingApi.createItems(tenantId, { items })
    return body.items || []
  }
}

export default XeroAPI
