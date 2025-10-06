import { SettingsContext } from '@settings/context/SettingsContext'
import { useContext } from 'react'

export const useSettingsContext = () => {
  const context = useContext(SettingsContext)
  if (!context)
    throw new Error('ClientSideError :: useSettings must be used within SettingsContextProvider')

  return context
}
