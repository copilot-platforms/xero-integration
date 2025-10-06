import { CalloutSection } from '@auth/components/CalloutSection'
import { RealtimeXeroConnections } from '@auth/components/RealtimeXeroConnections'
import AuthService from '@auth/lib/Auth.service'
import type { PageProps } from '@/app/(home)/types'
import type { SettingsFields } from '@/db/schema/settings.schema'
import type { XeroConnection, XeroConnectionWithTokenSet } from '@/db/schema/xeroConnections.schema'
import { AuthContextProvider } from '@/features/auth/context/AuthContext'
import { SettingsForm } from '@/features/settings/components/SettingsForm'
import { defaultSettings } from '@/features/settings/constants/defaults'
import { SettingsContextProvider } from '@/features/settings/context/SettingsContext'
import SettingsService from '@/features/settings/lib/Settings.service'
import { CopilotAPI } from '@/lib/copilot/CopilotAPI'
import { serializeClientUser } from '@/lib/copilot/models/ClientUser.model'
import User from '@/lib/copilot/models/User.model'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const getSettings = async (user: User, connection: XeroConnection) => {
  let settings: SettingsFields
  if (connection.tenantId) {
    // Using tenantID even though tokenSet might be expired because the sync-settings feature don't need to perform Xero API calls
    const settingsService = new SettingsService(user, connection as XeroConnectionWithTokenSet)
    settings = await settingsService.getSettings()
  } else {
    settings = defaultSettings
  }
  return settings
}

const Home = async ({ searchParams }: PageProps) => {
  const sp = await searchParams
  const user = await User.authenticate(sp.token)

  const authService = new AuthService(user)

  const copilot = new CopilotAPI(user.token)
  const workspacePromise = copilot.getWorkspace()
  const connectionPromise = authService.authorizeXeroForCopilotWorkspace(true)
  const [workspace, connection] = await Promise.all([workspacePromise, connectionPromise])

  const clientUser = serializeClientUser(user)

  const settings = await getSettings(user, connection)

  return (
    <AuthContextProvider
      user={clientUser}
      connectionStatus={!!connection.status}
      workspace={workspace}
    >
      <SettingsContextProvider {...settings}>
        <main className="min-h-[100vh] px-8 pt-6 pb-[54px] sm:px-[100px] lg:px-[220px]">
          <RealtimeXeroConnections user={clientUser} />
          <CalloutSection />
          <section>
            <SettingsForm />
          </section>
        </main>
      </SettingsContextProvider>
    </AuthContextProvider>
  )
}

export default Home
