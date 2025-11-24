import { getSyncLogsCsv } from '@/features/sync-logs/api/syncLogs.controller'
import { withErrorHandler } from '@/utils/withErrorHandler'

export const GET = withErrorHandler(getSyncLogsCsv)
