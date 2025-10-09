'use server'

import { and, eq } from 'drizzle-orm'
import db from '@/db'
import { getTableFields } from '@/db/db.helpers'
import { type SettingsFields, SettingsUpdateSchema, settings } from '@/db/schema/settings.schema'
import User from '@/lib/copilot/models/User.model'

export const updateSettingsAction = async (
  token: string,
  tenantId: string,
  payload: Partial<SettingsFields>,
): Promise<SettingsFields> => {
  const user = await User.authenticate(token)

  const parsedPayload = SettingsUpdateSchema.parse(payload)

  const [results] = await db
    .update(settings)
    .set(parsedPayload)
    .where(and(eq(settings.portalId, user.portalId), eq(settings.tenantId, tenantId)))
    .returning(
      getTableFields(settings, [
        'syncProductsAutomatically',
        'addAbsorbedFees',
        'useCompanyName',
        'initialInvoiceSettingsMapping',
        'initialProductSettingsMapping',
        'isSyncEnabled',
      ]),
    )

  return results
}
