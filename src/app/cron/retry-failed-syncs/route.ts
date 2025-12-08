import { retryFailedSyncs } from '@failed-syncs/api/failedSyncs.controller'
import { withErrorHandler } from '@/utils/withErrorHandler'

export const GET = withErrorHandler(retryFailedSyncs)
