import { useAuthContext } from '@auth/hooks/useAuth'
import type { XeroConnection } from '@/db/schema/xeroConnections.schema'
import type { ClientUser } from '@/lib/copilot/models/ClientUser.model'
import { useRealtime } from '@/lib/supabase/hooks/useRealtime'

export const useRealtimeXeroConnections = (user: ClientUser) => {
  const { connectionStatus } = useAuthContext()

  return useRealtime<XeroConnection>(
    user.portalId,
    'xero_connections',
    `portal_id=eq.${user.portalId}`,
    'UPDATE',
    (payload) => {
      if (connectionStatus === (payload.new as XeroConnection).status) {
        console.info('Skipping auth event...')
        return
      }

      // For some reason next/navigation causes issues here >:(
      window.location.replace(`/?token=${user.token}`)
    },
  )
}
