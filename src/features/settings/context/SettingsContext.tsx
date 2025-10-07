'use client'

import { createContext, type ReactNode, useState } from 'react'

type BaseSettingsContextType = {
  syncProductsAutomatically: boolean
  addAbsorbedFees: boolean
  useCompanyName: boolean
  initialInvoiceSettingsMapping: boolean
  initialProductSettingsMapping: boolean
}

export type SettingsContextType = BaseSettingsContextType & {
  initialSettings: BaseSettingsContextType
}

export const SettingsContext = createContext<
  | (SettingsContextType & {
      setSettings: React.Dispatch<React.SetStateAction<SettingsContextType>>
      updateSettings: (state: Partial<SettingsContextType>) => void
    })
  | null
>(null)

export const SettingsContextProvider = ({
  syncProductsAutomatically,
  addAbsorbedFees,
  useCompanyName,
  initialInvoiceSettingsMapping,
  initialProductSettingsMapping,
  children,
}: BaseSettingsContextType & { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsContextType>({
    syncProductsAutomatically,
    addAbsorbedFees,
    useCompanyName,
    initialInvoiceSettingsMapping,
    initialProductSettingsMapping,
    initialSettings: {
      syncProductsAutomatically,
      addAbsorbedFees,
      useCompanyName,
      initialInvoiceSettingsMapping,
      initialProductSettingsMapping,
    },
  })

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setSettings,
        updateSettings: (state) => {
          setSettings({ ...settings, ...state })
        },
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
