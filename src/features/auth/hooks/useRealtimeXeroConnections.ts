import { useAppState } from '@/context/AppStateContext'
import type { XeroConnection } from '@/db/schema/xeroConnections.schema'
import type { ClientUser } from '@/lib/copilot/models/ClientUser.model'
import { useRealtime } from '@/lib/supabase/hooks/useRealtime'

export const useRealtimeXeroConnections = (user: ClientUser) => {
  const { updateAppState } = useAppState()

  return useRealtime<XeroConnection>(
    user.portalId,
    'xero_connections',
    `portal_id=eq.${user.portalId}`,
    'UPDATE',
    (payload) => {
      const newPayload = payload.new as XeroConnection
      updateAppState({ connectionStatus: newPayload.status })
    },
  )
}
