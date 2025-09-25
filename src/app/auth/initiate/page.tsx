import { redirect } from 'next/navigation'
import type { PageProps } from '@/app/(home)/types'
import User from '@/lib/copilot/models/User.model'
import XeroAPI from '@/lib/xero/XeroAPI'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const AuthInitiatePage = async ({ searchParams }: PageProps) => {
  const sp = await searchParams
  const user = await User.authenticate(sp.token)
  const xero = new XeroAPI()
  const consentUrl = new URL(await xero.buildConsentUrl())
  consentUrl.searchParams.set('state', user.token)
  redirect(consentUrl.toString())
}

export default AuthInitiatePage
