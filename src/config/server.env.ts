import 'server-only'

import { z } from 'zod'

const ServerEnvSchema = z.object({
  COPILOT_API_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  XERO_CLIENT_ID: z.string().min(1),
  XERO_CLIENT_SECRET: z.string().min(1),
  XERO_CALLBACK_URL: z.url(),
  XERO_SCOPES: z.string().min(1),
  VERCEL_ENV: z.string().optional(),
})

const env = ServerEnvSchema.parse(process.env)
export default env
