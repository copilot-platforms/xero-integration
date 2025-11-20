import 'server-only'

import {
  serializeContactForClient,
  serializeContactForCompany,
} from '@invoice-sync/lib/serializers'
import { and, eq } from 'drizzle-orm'
import status from 'http-status'
import type { Contact } from 'xero-node'
import z from 'zod'
import db from '@/db'
import { SyncedContactUserType, syncedContacts } from '@/db/schema/syncedContacts.schema'
import APIError from '@/errors/APIError'
import SettingsService from '@/features/settings/lib/Settings.service'
import { CopilotAPI } from '@/lib/copilot/CopilotAPI'
import type { ClientResponse, CompanyResponse } from '@/lib/copilot/types'
import { buildClientName } from '@/lib/copilot/utils'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ContactCreatePayload, ValidContact } from '@/lib/xero/types'

class SyncedContactsService extends AuthenticatedXeroService {
  async getSyncedContact(clientId: string): Promise<Contact> {
    logger.info('SyncedContactsService#getSyncedContact :: Getting synced contact for', clientId)

    const settingsService = new SettingsService(this.user, this.connection)
    const { useCompanyName } = await settingsService.getSettings()

    const copilot = new CopilotAPI(this.user.token)
    const client = await copilot.getClient(clientId)
    const companyId = z.string().parse(client.companyIds?.[0])

    let company: CompanyResponse | undefined
    if (useCompanyName) {
      company = await this.copilot.getCompany(z.string().parse(companyId))
    }

    const query = db
      .select({ contactID: syncedContacts.contactId })
      .from(syncedContacts)
      .where(
        and(
          eq(syncedContacts.portalId, this.user.portalId),
          eq(syncedContacts.tenantId, this.connection.tenantId),
          eq(syncedContacts.clientOrCompanyId, useCompanyName ? companyId : clientId),
          eq(
            syncedContacts.userType,
            useCompanyName ? SyncedContactUserType.COMPANY : SyncedContactUserType.CLIENT,
          ),
        ),
      )

    let [contact] = await query

    // If contact exists, return it and end method. Else, delete existing contact sync to create a new one.
    if (contact) {
      const xeroContact = await this.xero.getContact(this.connection.tenantId, contact.contactID)
      if (xeroContact) {
        await this.validateXeroContact(xeroContact, useCompanyName, client, company)
        return xeroContact
      }

      await db
        .delete(syncedContacts)
        .where(
          and(
            eq(syncedContacts.portalId, this.user.portalId),
            eq(syncedContacts.tenantId, this.connection.tenantId),
            eq(syncedContacts.clientOrCompanyId, clientId),
          ),
        )
    }

    logger.info(
      `SyncedContactsService#createContact :: Couldn't find existing client... creating a new one for ${clientId}`,
    )
    contact = await this.createContact(client, company)

    return contact
  }

  async createContact(
    client: ClientResponse,
    company?: CompanyResponse,
  ): Promise<Contact & { contactID: string }> {
    logger.info(
      'SyncedContactsService#createContact :: Creating synced contact for',
      client,
      company,
    )
    const companyId = z.string().parse(client.companyIds?.[0])

    const settingsService = new SettingsService(this.user, this.connection)
    const { useCompanyName } = await settingsService.getSettings()

    let contactPayload: ContactCreatePayload

    if (useCompanyName) {
      if (!company) {
        company = await this.copilot.getCompany(z.string().parse(client.companyIds?.[0]))
      }
      contactPayload = serializeContactForCompany(company, client.email)
    } else {
      contactPayload = serializeContactForClient(client)
    }

    const contact = await this.xero.createContact(this.connection.tenantId, contactPayload)
    await db.insert(syncedContacts).values({
      portalId: this.user.portalId,
      clientOrCompanyId: useCompanyName ? companyId : client.id,
      userType: useCompanyName ? SyncedContactUserType.COMPANY : SyncedContactUserType.CLIENT,
      contactId: z.string().parse(contact.contactID),
      tenantId: this.connection.tenantId,
    })
    return {
      ...contact,
      contactID: z.string().parse(contact.contactID),
    }
  }

  /**
   * Makes sure that client / company information between Xero and Copilot is synced.
   * If details are not synced, update the Xero contact.
   */
  async validateXeroContact(
    contact: ValidContact,
    useCompanyName: boolean,
    client: ClientResponse,
    company?: CompanyResponse,
  ) {
    logger.info(
      'SyncedContactsService#validateXeroContact :: Validating xero contact for ',
      contact,
      'using company name:',
      useCompanyName,
      'with client & company:',
      client,
      company,
    )

    if (useCompanyName && !company) {
      throw new APIError(
        'Failed to fetch company details while using use company name setting',
        status.INTERNAL_SERVER_ERROR,
      )
    }

    if (useCompanyName && company) {
      if (contact.name !== `${company.name}`) {
        await this.xero.updateContact(this.connection.tenantId, {
          ...contact,
          name: `${company.name}`,
        })
      }
      return
    }

    if (
      contact.name !== buildClientName(client) ||
      contact.firstName !== client.givenName ||
      contact.lastName !== client.familyName ||
      contact.emailAddress !== client.email
    ) {
      await this.xero.updateContact(this.connection.tenantId, {
        ...contact,
        name: buildClientName(client),
        firstName: client.givenName,
        lastName: client.familyName,
        emailAddress: client.email,
      })
    }
  }
}

export default SyncedContactsService
