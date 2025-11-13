import { SettingsContext } from '@settings/context/SettingsContext'
import { useContext, useMemo } from 'react'

export const useSettingsContext = () => {
  const context = useContext(SettingsContext)

  const { productMappings, xeroItems } = context || {}

  // Dynamically compute dropdownXeroItems
  const dropdownXeroItems = useMemo(() => {
    const alreadyMappedItemIDs =
      (productMappings
        ?.filter((mapping) => mapping.item?.code)
        .map((mapping) => mapping.item?.code) // mapping.item must exist here but typescript doesn't get that
        .filter((mapping) => typeof mapping === 'string') as string[]) || []

    return xeroItems?.filter((item) => !alreadyMappedItemIDs.includes(item.code)) || []
  }, [productMappings, xeroItems])

  if (!context)
    throw new Error('ClientSideError :: useSettings must be used within SettingsContextProvider')

  return { ...context, dropdownXeroItems }
}
