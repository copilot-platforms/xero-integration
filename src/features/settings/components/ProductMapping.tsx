'use client'

import { useSettingsContext } from '@settings/hooks/useSettings'
import { Checkbox } from 'copilot-design-system'

export const ProductMapping = () => {
  const { syncProductsAutomatically, updateSettings } = useSettingsContext()

  return (
    <div className="mb-5">
      <Checkbox
        label="Sync Assembly products to Xero"
        description="Automatically create and update Xero items when products are created or updated in Assembly."
        checked={syncProductsAutomatically}
        onChange={() => updateSettings({ syncProductsAutomatically: !syncProductsAutomatically })}
      />
    </div>
  )
}
