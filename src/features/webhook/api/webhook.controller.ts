import AuthService from '@auth/lib/Auth.service'
import { WebhookEventSchema } from '@invoice-sync/types'
import SettingsService from '@settings/lib/Settings.service'
import WebhookService from '@webhook/lib/webhook.service'
import { type NextRequest, NextResponse } from 'next/server'
import User from '@/lib/copilot/models/User.model'
import logger from '@/lib/logger'

export const handleCopilotWebhook = async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get('token')
  const user = await User.authenticate(token)

  const authService = new AuthService(user)
  const connection = await authService.authorizeXeroForCopilotWorkspace()

  const settingsService = new SettingsService(user, connection)
  const settings = await settingsService.getOrCreateSettings()
  if (!settings.isSyncEnabled) {
    logger.info(
      'webhook/api/webhook.controller#handleCopilotWebhook :: Sync is disabled for this workspace. Skipping...',
    )
    return NextResponse.json({ message: 'Sync is disabled for this workspace' })
  }

  const reqBody = await req.json()
  const webhookData = WebhookEventSchema.safeParse(reqBody)
  if (!webhookData.success) {
    logger.info(
      'webhook/api/webhook.controller#handleCopilotWebhook :: Ignored webhook call for event',
      reqBody,
      webhookData.error,
    )
    return NextResponse.json({ message: 'Ignored webhook call for event' })
  }

  const webhookService = new WebhookService(user, connection)
  const data = await webhookService.handleEvent(webhookData.data)

  return NextResponse.json({ message: 'Webhook received', data })
}
