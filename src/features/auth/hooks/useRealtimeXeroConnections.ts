import { useAuthContext } from '@auth/hooks/useAuth'
import type { XeroConnection } from '@/db/schema/xeroConnections.schema'
import type { ClientUser } from '@/lib/copilot/models/ClientUser.model'
import { useRealtime } from '@/lib/supabase/hooks/useRealtime'

export const useRealtimeXeroConnections = (user: ClientUser) => {
  const { updateAuth } = useAuthContext()

  return useRealtime<XeroConnection>(
    user.portalId,
    'xero_connections',
    `portal_id=eq.${user.portalId}`,
    'UPDATE',
    (payload) => {
      const newPayload = payload.new as XeroConnection
      updateAuth({ connectionStatus: newPayload.status })
    },
  )
}
