import { AppMenuTrigger } from '@auth/components/AppBridge'
import { CalloutSection } from '@auth/components/CalloutSection'
import { RealtimeXeroConnections } from '@auth/components/RealtimeXeroConnections'
import { AuthContextProvider } from '@auth/context/AuthContext'
import AuthService from '@auth/lib/Auth.service'
import SyncedInvoicesService from '@invoice-sync/lib/SyncedInvoices.service'
import { SettingsForm } from '@settings/components/SettingsForm'
import { defaultSettings } from '@settings/constants/defaults'
import { SettingsContextProvider } from '@settings/context/SettingsContext'
import ProductMappingsService from '@settings/lib/ProductMappings.service'
import SettingsService from '@settings/lib/Settings.service'
import type { PageProps } from '@/app/(home)/types'
import type { SettingsFields } from '@/db/schema/settings.schema'
import type { XeroConnection, XeroConnectionWithTokenSet } from '@/db/schema/xeroConnections.schema'
import { CopilotAPI } from '@/lib/copilot/CopilotAPI'
import { serializeClientUser } from '@/lib/copilot/models/ClientUser.model'
import User from '@/lib/copilot/models/User.model'
import logger from '@/lib/logger'
import type { ClientXeroItem } from '@/lib/xero/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

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

const getProductMappings = async (
  user: User,
  connection: XeroConnection,
): ReturnType<ProductMappingsService['getProductMappings']> => {
  if (!connection.tenantId) return []

  const productMappingsService = new ProductMappingsService(
    user,
    connection as XeroConnectionWithTokenSet,
  )
  return await productMappingsService.getProductMappings()
}

const getXeroItems = async (user: User, connection: XeroConnection): Promise<ClientXeroItem[]> => {
  if (!connection.tenantId) return []

  const productMappingsService = new ProductMappingsService(
    user,
    connection as XeroConnectionWithTokenSet,
  )
  return await productMappingsService.getClientXeroItems()
}

const getLastSyncedAt = async (user: User, connection: XeroConnection): Promise<Date | null> => {
  if (!connection.tenantId) return null

  const syncedInvoicesService = new SyncedInvoicesService(
    user,
    connection as XeroConnectionWithTokenSet,
  )
  return await syncedInvoicesService.getLastSyncedAt()
}

const Home = async ({ searchParams }: PageProps) => {
  const sp = await searchParams
  const user = await User.authenticate(sp.token)
  const authService = new AuthService(user)

  const copilot = new CopilotAPI(user.token)
  const [connection, workspace] = await Promise.all([
    authService.authorizeXeroForCopilotWorkspace(true),
    copilot.getWorkspace(),
  ])

  const [settings, productMappings, xeroItems, lastSyncedAt] = await Promise.all([
    getSettings(user, connection),
    getProductMappings(user, connection),
    getXeroItems(user, connection),
    getLastSyncedAt(user, connection),
  ])

  const clientUser = serializeClientUser(user)
  logger.info(
    'app/(home)/page :: Serving Xero Integration app for user',
    clientUser,
    'with connectionId',
    connection.id,
  )

  const needsReconnection =
    !!connection.tokenSet && (connection.tokenSet.expires_at || 0) * 1000 < Date.now()

  return (
    <AuthContextProvider
      user={clientUser}
      tenantId={connection.tenantId}
      connectionStatus={!!connection.status}
      needsReconnection={needsReconnection}
      lastSyncedAt={lastSyncedAt}
      workspace={workspace}
    >
      <SettingsContextProvider
        {...settings}
        productMappings={productMappings}
        xeroItems={xeroItems}
      >
        <main className="min-h-[100vh] px-8 pt-6 pb-[54px] sm:px-[100px] lg:px-[220px]">
          <RealtimeXeroConnections user={clientUser} />
          <AppMenuTrigger token={clientUser.token} />
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
