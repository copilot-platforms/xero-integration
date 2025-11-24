'use server'

import AuthService from '@auth/lib/Auth.service'
import { and, eq } from 'drizzle-orm'
import db from '@/db'
import { settings } from '@/db/schema/settings.schema'
import User from '@/lib/copilot/models/User.model'

export const disconnectApp = async (token: string) => {
  const user = await User.authenticate(token)

  const authService = new AuthService(user)
  const connection = await authService.authorizeXeroForCopilotWorkspace()

  await db
    .update(settings)
    .set({
      isSyncEnabled: false,
    })
    .where(and(eq(settings.portalId, user.portalId), eq(settings.tenantId, connection.tenantId)))
}
