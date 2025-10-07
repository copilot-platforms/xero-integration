import type { ValidWebhookEvent } from '@invoice-sync/types'
import { and, eq } from 'drizzle-orm'
import db from '@/db'
import { failedSyncs } from '@/db/schema/failedSyncs.schema'
import BaseService from '@/lib/copilot/services/base.service'

class FailedSyncsService extends BaseService {
  async addFailedSyncRecord(
    tenantId: string,
    type: ValidWebhookEvent,
    payload: object & { id: string },
  ): Promise<void> {
    const [existingFailedSync] = await db
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
      await db
        .update(failedSyncs)
        .set({
          attempts: existingFailedSync.attempts + 1,
        })
        .where(eq(failedSyncs.id, existingFailedSync.id))
    } else {
      await db.insert(failedSyncs).values({
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
    await db
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
