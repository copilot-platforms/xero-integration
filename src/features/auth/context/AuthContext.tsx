'use client'

import { createContext, type ReactNode, useState } from 'react'
import type { ClientUser } from '@/lib/copilot/models/ClientUser.model'
import type { WorkspaceResponse } from '@/lib/copilot/types'

export type AuthContextType = {
  user: ClientUser
  tenantId: string | null
  connectionStatus: boolean
  needsReconnection: boolean
  workspace: WorkspaceResponse
  lastSyncedAt?: Date | null
}

export const AuthContext = createContext<
  | (AuthContextType & {
      setAuth: React.Dispatch<React.SetStateAction<AuthContextType>>
      updateAuth: (state: Partial<AuthContextType>) => void
    })
  | null
>(null)

export const AuthContextProvider = ({
  user,
  tenantId,
  connectionStatus,
  needsReconnection,
  workspace,
  lastSyncedAt,
  children,
}: AuthContextType & { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthContextType>({
    user,
    tenantId,
    connectionStatus,
    needsReconnection,
    workspace,
    lastSyncedAt,
  })
  return (
    <AuthContext.Provider
      value={{
        ...auth,
        setAuth,
        updateAuth: (state) => setAuth((prev) => ({ ...prev, ...state })),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
