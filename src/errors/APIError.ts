import type { CreateSyncLogPayload } from '@/db/schema/syncLogs.schema'
import { BaseServerError } from '@/errors/BaseServerError'

class APIError extends BaseServerError {
  readonly error?: unknown

  constructor(
    message: string,
    readonly status: number = 500,
    readonly opts?: {
      error?: unknown
      failedSyncLogPayload?: Omit<CreateSyncLogPayload, 'status' | 'syncDate' | 'errorMessage'>
    },
  ) {
    super(message, status)
    this.name = 'APIError'
    this.error = opts?.error
  }
}

export default APIError
