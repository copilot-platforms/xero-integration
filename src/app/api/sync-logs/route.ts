import { getSyncLogsCsv } from '@sync-logs/api/syncLogs.controller'
import { withErrorHandler } from '@/utils/withErrorHandler'

export const maxDuration = 800

export const GET = withErrorHandler(getSyncLogsCsv)
