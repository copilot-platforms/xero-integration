import { serializeContact } from '@invoice-sync/lib/serializer'
import { and, eq } from 'drizzle-orm'
import type { Contact } from 'xero-node'
import z from 'zod'
import db from '@/db'
import { clientContactMappings } from '@/db/schema/clientContactMappings.schema'
import { CopilotAPI } from '@/lib/copilot/CopilotAPI'
import type { ClientResponse } from '@/lib/copilot/types'
import { buildClientName } from '@/lib/copilot/utils'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import type { ValidContact } from '@/lib/xero/types'

class XeroContactService extends AuthenticatedXeroService {
  async getSyncedContact(clientId: string): Promise<Contact> {
    const copilot = new CopilotAPI(this.user.token)
    const client = await copilot.getClient(clientId)

    const syncedContacts = await db
      .select({ contactID: clientContactMappings.contactId })
      .from(clientContactMappings)
      .where(
        and(
          eq(clientContactMappings.portalId, this.user.portalId),
          eq(clientContactMappings.clientId, clientId),
        ),
      )

    let contact = syncedContacts[0]

    // If contact exists, return it and end method. Else, delete existing contact sync to create a new one.
    if (contact) {
      const xeroContact = await this.xero.getContact(this.connection.tenantId, contact.contactID)
      if (xeroContact) {
        await this.validateXeroContact(xeroContact, client)
        return xeroContact
      }

      await db
        .delete(clientContactMappings)
        .where(
          and(
            eq(clientContactMappings.portalId, this.user.portalId),
            eq(clientContactMappings.clientId, clientId),
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
    await db.insert(clientContactMappings).values({
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

export default XeroContactService
