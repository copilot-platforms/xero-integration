'use client'

import type { SettingsContextType } from '@settings/context/SettingsContext'
import { useSettingsContext } from '@settings/hooks/useSettings'
import { useEffect } from 'react'

export const SettingsContextSetter = ({
  productMappings,
}: Pick<SettingsContextType, 'productMappings'>) => {
  const { updateSettings } = useSettingsContext()

  useEffect(() => {
    if (typeof window !== 'undefined' && updateSettings && productMappings) {
      updateSettings({ productMappings })
    }
  }, [productMappings, updateSettings])

  return null
}
