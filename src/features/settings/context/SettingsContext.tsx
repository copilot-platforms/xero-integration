'use client'

import type { ProductMapping } from '@items-sync/types'
import { createContext, type ReactNode, useCallback, useState } from 'react'
import type { SettingsFields } from '@/db/schema/settings.schema'

type BaseSettingsContextType = SettingsFields & {
  productMappings?: ProductMapping[]
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
  isSyncEnabled,
  productMappings,
  children,
}: BaseSettingsContextType & { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsContextType>({
    syncProductsAutomatically,
    addAbsorbedFees,
    useCompanyName,
    initialInvoiceSettingsMapping,
    initialProductSettingsMapping,
    productMappings,
    isSyncEnabled,

    initialSettings: {
      syncProductsAutomatically,
      addAbsorbedFees,
      useCompanyName,
      initialInvoiceSettingsMapping,
      initialProductSettingsMapping,
      isSyncEnabled,
      productMappings,
    },
  })

  const updateSettings = useCallback((state: Partial<SettingsContextType>) => {
    setSettings((prev) => ({ ...prev, ...state }))
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
