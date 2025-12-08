import RetryFailedSyncsService from '@failed-syncs/lib/RetryFailedSyncs.service'
import status from 'http-status'
import { type NextRequest, NextResponse } from 'next/server'
import env from '@/config/server.env'
import APIError from '@/errors/APIError'

export const retryFailedSyncs = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    throw new APIError('Unauthorized', status.UNAUTHORIZED)
  }

  const retryFailedSyncsService = new RetryFailedSyncsService()
  await retryFailedSyncsService.retryFailedSyncs()

  return NextResponse.json({
    message: 'Retried failed syncs',
  })
}
