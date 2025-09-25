import { CalloutSection } from '@auth/components/CalloutSection'
import { RealtimeXeroConnections } from '@auth/components/RealtimeXeroConnections'
import AuthService from '@auth/lib/Auth.service'
import type { PageProps } from '@/app/(home)/types'
import { AppStateContextProvider } from '@/context/AppStateContext'
import { serializeClientUser } from '@/lib/copilot/models/ClientUser.model'
import User from '@/lib/copilot/models/User.model'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const Home = async ({ searchParams }: PageProps) => {
  const sp = await searchParams
  const user = await User.authenticate(sp.token)

  const authService = new AuthService(user)
  const xeroConection = await authService.authorizeXeroForCopilotWorkspace(true)

  const clientUser = serializeClientUser(user)

  return (
    <AppStateContextProvider user={clientUser} connectionStatus={!!xeroConection.status}>
      <main className="min-h-[100vh] px-8 pt-6 pb-[54px] sm:px-[100px] lg:px-[220px]">
        <RealtimeXeroConnections user={clientUser} />
        <CalloutSection />
      </main>
    </AppStateContextProvider>
  )
}

export default Home
