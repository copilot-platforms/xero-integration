import 'server-only'

import { eq } from 'drizzle-orm'
import type { TokenSet } from 'xero-node'
import { z } from 'zod'
import db from '@/db'
import {
  type XeroConnection,
  type XeroConnectionUpdatePayload,
  xeroConnections,
} from '@/db/schema/xeroConnections.schema'
import BaseService from '@/lib/copilot/services/base.service'
import logger from '@/lib/logger'
import XeroAPI from '@/lib/xero/XeroAPI'

class XeroConnectionsService extends BaseService {
  async getConnectionForWorkspace(): Promise<XeroConnection> {
    logger.info(
      'XeroConnectionsService#getConnectionForWorkspace :: Fetching connection for portalId',
      this.user.portalId,
    )
    let [connection] = await db
      .select()
      .from(xeroConnections)
      .where(eq(xeroConnections.portalId, this.user.portalId))

    if (!connection) {
      const newConnection = await db
        .insert(xeroConnections)
        .values({
          portalId: z.string().min(1).parse(this.user.portalId),
          status: false,
          initiatedBy: z.uuid().parse(this.user.internalUserId),
        })
        .returning()
      connection = newConnection[0]
    }

    return connection
  }

  async updateConnectionForWorkspace(
    payload: XeroConnectionUpdatePayload,
  ): Promise<XeroConnection> {
    logger.info(
      'XeroConnectionsService#updateConnectionForWorkspace :: Updating connection for portalId',
      this.user.portalId,
      'with payload',
      payload,
    )

    const connections = await db
      .update(xeroConnections)
      .set(payload)
      .where(eq(xeroConnections.portalId, this.user.portalId))
      .returning()
    return connections[0]
  }

  async handleXeroConnectionCallback(
    urlParams: Record<string, string | string[] | undefined>,
  ): Promise<XeroConnection> {
    logger.info(
      'XeroConnectionsService#handleXeroConnectionCallback :: Handling Xero connection callback for urlParams',
      urlParams,
    )

    let tokenSet: TokenSet, tenantId: string
    try {
      const xero = new XeroAPI()
      tokenSet = await xero.handleApiCallback(urlParams)
      tenantId = await xero.getActiveTenantId()
    } catch (error) {
      logger.error(
        'XeroConnectionsService#handleXeroConnectionCallback :: Error handling Xero callback:',
        error,
      )
      throw new Error('Error handling Xero callback')
    }

    const xeroConnectionsService = new XeroConnectionsService(this.user)
    return await xeroConnectionsService.updateConnectionForWorkspace({ tokenSet, tenantId })
  }
}

export default XeroConnectionsService
