import 'server-only'

import { serializeContact } from '@invoice-sync/lib/serializers'
import { and, eq } from 'drizzle-orm'
import type { Contact } from 'xero-node'
import z from 'zod'
import db from '@/db'
import { syncedContacts } from '@/db/schema/syncedContacts.schema'
import { CopilotAPI } from '@/lib/copilot/CopilotAPI'
import type { ClientResponse } from '@/lib/copilot/types'
import { buildClientName } from '@/lib/copilot/utils'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ValidContact } from '@/lib/xero/types'

class SyncedContactsService extends AuthenticatedXeroService {
  async getSyncedContact(clientId: string): Promise<Contact> {
    const copilot = new CopilotAPI(this.user.token)
    const client = await copilot.getClient(clientId)

    const syncedContactRecords = await db
      .select({ contactID: syncedContacts.contactId })
      .from(syncedContacts)
      .where(
        and(
          eq(syncedContacts.portalId, this.user.portalId),
          eq(syncedContacts.tenantId, this.connection.tenantId),
          eq(syncedContacts.clientId, clientId),
        ),
      )

    let contact = syncedContactRecords[0]

    // If contact exists, return it and end method. Else, delete existing contact sync to create a new one.
    if (contact) {
      const xeroContact = await this.xero.getContact(this.connection.tenantId, contact.contactID)
      if (xeroContact) {
        await this.validateXeroContact(xeroContact, client)
        return xeroContact
      }

      await db
        .delete(syncedContacts)
        .where(
          and(
            eq(syncedContacts.portalId, this.user.portalId),
            eq(syncedContacts.tenantId, this.connection.tenantId),
            eq(syncedContacts.clientId, clientId),
          ),
        )
    }
    logger.info(
      `XeroContactService#getSyncedXeroContact :: Couldn't find existing client... creating a new one for ${clientId}`,
    )
    contact = await this.createContact(client)
    return contact
  }

  async createContact(client: ClientResponse): Promise<Contact & { contactID: string }> {
    const contactPayload = serializeContact(client)
    const contact = await this.xero.createContact(this.connection.tenantId, contactPayload)
    await db.insert(syncedContacts).values({
      portalId: this.user.portalId,
      clientId: client.id,
      contactId: z.string().parse(contact.contactID),
      tenantId: this.connection.tenantId,
    })
    return {
      ...contact,
      contactID: z.string().parse(contact.contactID),
    }
  }

  /**
   * Makes sure that client information between Xero and Copilot is the same
   * @param contact
   * @param client
   */
  async validateXeroContact(contact: ValidContact, client: ClientResponse) {
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
