import AuthService from '@auth/lib/Auth.service'
import { type NextRequest, NextResponse } from 'next/server'
import User from '@/lib/copilot/models/User.model'
import { SyncLogsService } from '../lib/SyncLogs.service'

export const getSyncLogsCsv = async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get('token')
  const user = await User.authenticate(token)

  const authService = new AuthService(user)
  const connection = await authService.authorizeXeroForCopilotWorkspace()

  const syncLogsService = new SyncLogsService(user, connection)
  const data = await syncLogsService.getSyncLogsCsv()

  return new NextResponse(data, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=sync-history.csv`,
    },
  })
}
