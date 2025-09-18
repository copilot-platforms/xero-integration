'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'
import type { ClientUser } from '@/lib/copilot/models/ClientUser.model'

export type AppStateContextType = {
  user: ClientUser
  connectionStatus: boolean
}

const AppStateContext = createContext<
  | (AppStateContextType & {
      setAppState: React.Dispatch<React.SetStateAction<AppStateContextType>>
      updateAppState: (state: Partial<AppStateContextType>) => void
    })
  | null
>(null)

export const AppStateContextProvider = ({
  user,
  connectionStatus,
  children,
}: AppStateContextType & { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppStateContextType>({
    user,
    connectionStatus,
  })
  return (
    <AppStateContext.Provider
      value={{
        ...appState,
        setAppState,
        updateAppState: (state) => setAppState((prev) => ({ ...prev, ...state })),
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('ClientSideError :: useApp must be used within AppProvider')

  return context
}
