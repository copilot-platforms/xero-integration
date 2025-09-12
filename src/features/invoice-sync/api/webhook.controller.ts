import AuthService from '@auth/lib/Auth.service'
import WebhookService from '@invoice-sync/lib/webhook.service'
import { WebhookEventSchema } from '@invoice-sync/types'
import { type NextRequest, NextResponse } from 'next/server'
import User from '@/lib/copilot/models/User.model'
import logger from '@/lib/logger'

export const handleCopilotWebhook = async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get('token')
  const user = await User.authenticate(token)

  const authService = new AuthService(user)
  const connection = await authService.authorizeXeroForCopilotWorkspace()

  const reqBody = await req.json()
  const webhookData = WebhookEventSchema.safeParse(reqBody)
  if (!webhookData.success) {
    logger.info('Ignoring webhook for ', webhookData.data)
    return NextResponse.json({ message: 'Ignored webhook call for event' })
  }

  const webhookService = new WebhookService(user, connection)
  const data = await webhookService.handleEvent(webhookData.data)

  return NextResponse.json({ message: 'Webhook received', data })
}
