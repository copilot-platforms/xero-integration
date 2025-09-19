import { handleCopilotWebhook } from '@webhook/api/webhook.controller'
import { withErrorHandler } from '@/utils/withErrorHandler'

export const POST = withErrorHandler(handleCopilotWebhook)
