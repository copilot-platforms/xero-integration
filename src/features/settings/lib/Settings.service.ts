import { defaultSettings } from '@settings/constants/defaults'
import { and, eq } from 'drizzle-orm'
import db from '@/db'
import { getTableFields } from '@/db/db.helpers'
import { type SettingsFields, settings } from '@/db/schema/settings.schema'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'

class SettingsService extends AuthenticatedXeroService {
  async getSettings(): Promise<SettingsFields> {
    const [syncSettings] = await db
      .select(
        getTableFields(settings, [
          'syncProductsAutomatically',
          'addAbsorbedFees',
          'useCompanyName',
          'isSyncEnabled',
          'initialInvoiceSettingsMapping',
          'initialProductSettingsMapping',
        ]),
      )
      .from(settings)
      .where(
        and(
          eq(settings.portalId, this.user.portalId),
          eq(settings.tenantId, this.connection.tenantId),
        ),
      )
    if (syncSettings) {
      return syncSettings
    }

    const [newSyncSettings] = await db.insert(settings).values({
      portalId: this.user.portalId,
      tenantId: this.connection.tenantId,
      // Default sync settings
      ...defaultSettings,
    })
    return newSyncSettings
  }
}

export default SettingsService
