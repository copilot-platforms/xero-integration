'use client'

import { createContext, type ReactNode, useState } from 'react'
import type { ClientUser } from '@/lib/copilot/models/ClientUser.model'
import type { WorkspaceResponse } from '@/lib/copilot/types'

export type AuthContextType = {
  user: ClientUser
  tenantId: string | null
  connectionStatus: boolean
  workspace: WorkspaceResponse
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
  workspace,
  children,
}: AuthContextType & { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthContextType>({
    user,
    tenantId,
    connectionStatus,
    workspace,
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
