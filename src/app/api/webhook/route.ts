import { handleCopilotWebhook } from '@webhook/api/webhook.controller'
import { withErrorHandler } from '@/utils/withErrorHandler'

export const maxDuration = 300

export const POST = withErrorHandler(handleCopilotWebhook)
