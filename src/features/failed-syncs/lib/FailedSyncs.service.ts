import type { ValidWebhookEvent } from '@invoice-sync/types'
import { and, eq } from 'drizzle-orm'
import { failedSyncs } from '@/db/schema/failedSyncs.schema'
import BaseService from '@/lib/copilot/services/base.service'
import logger from '@/lib/logger'

class FailedSyncsService extends BaseService {
  async addFailedSyncRecord(
    tenantId: string,
    type: ValidWebhookEvent,
    payload: object & { id: string },
  ): Promise<void> {
    logger.info(
      'FailedSyncsService#addFailedSyncRecord :: Adding failed sync record for',
      tenantId,
      'for webhook',
      type,
      'with payload',
      payload,
    )

    const [existingFailedSync] = await this.db
      .select()
      .from(failedSyncs)
      .where(
        and(
          eq(failedSyncs.portalId, this.user.portalId),
          eq(failedSyncs.tenantId, tenantId),
          eq(failedSyncs.resourceId, payload.id),
        ),
      )

    if (existingFailedSync) {
      await this.db
        .update(failedSyncs)
        .set({
          attempts: existingFailedSync.attempts + 1,
        })
        .where(eq(failedSyncs.id, existingFailedSync.id))
    } else {
      await this.db.insert(failedSyncs).values({
        portalId: this.user.portalId,
        tenantId,
        resourceId: payload.id,
        type,
        payload,
        token: this.user.token,
      })
    }
  }

  async deleteFailedSync(portalId: string, tenantId: string, recordId: string) {
    logger.info(
      'FailedSyncsService#deleteFailedSync :: deleting failed sync record for',
      portalId,
      tenantId,
      recordId,
    )

    await this.db
      .delete(failedSyncs)
      .where(
        and(
          eq(failedSyncs.portalId, portalId),
          eq(failedSyncs.tenantId, tenantId),
          eq(failedSyncs.resourceId, recordId),
        ),
      )
  }
}

export default FailedSyncsService
