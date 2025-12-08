import * as Sentry from '@sentry/nextjs'
import CopilotNoTokenError from '@/lib/copilot/errors/CopilotNoTokenError'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

type RequestInfo = {
  path: string
  method: string
  headers: Record<string, string | string[] | undefined>
}

type ErrorContext = {
  routerKind: string
  routePath: string
  routeType: string
}

export const onRequestError = (
  error: unknown,
  request: RequestInfo,
  errorContext: ErrorContext,
) => {
  if (error instanceof CopilotNoTokenError) {
    return
  }
  Sentry.captureRequestError(error, request, errorContext)
}
