'use client'

import { useSettingsContext } from '@settings/hooks/useSettings'
import { Checkbox } from 'copilot-design-system'
import { ProductMappingTable } from '@/features/settings/components/ProductMapping/ProductMappingTable'

export const ProductMapping = () => {
  const { syncProductsAutomatically, updateSettings, productMappings } = useSettingsContext()

  return (
    <div className="mb-5">
      <Checkbox
        label="Sync Assembly products to Xero"
        description="Automatically create and update Xero items when products are created or updated in Assembly."
        checked={syncProductsAutomatically}
        onChange={() => updateSettings({ syncProductsAutomatically: !syncProductsAutomatically })}
      />
      <ProductMappingTable items={productMappings} />
    </div>
  )
}
