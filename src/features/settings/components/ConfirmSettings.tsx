'use client'

import { useSettingsContext } from '@settings/hooks/useSettings'
import { Button } from 'copilot-design-system'

interface ConfirmSettingsProps {
  mode: 'product' | 'invoice'
}

export const ConfirmSettings = ({ mode }: ConfirmSettingsProps) => {
  const {
    initialSettings,
    initialProductSettingsMapping,
    initialInvoiceSettingsMapping,
    syncProductsAutomatically,
    addAbsorbedFees,
    useCompanyName,
  } = useSettingsContext()

  const [initialMapping, showButtons] =
    mode === 'product'
      ? [
          initialProductSettingsMapping,
          syncProductsAutomatically !== initialSettings.syncProductsAutomatically,
        ]
      : [
          initialInvoiceSettingsMapping,
          addAbsorbedFees !== initialSettings.addAbsorbedFees ||
            useCompanyName !== initialSettings.useCompanyName,
        ]

  if (!showButtons) return null

  return (
    <div className="flex max-h-6 items-center justify-end">
      <Button label="Cancel" variant="text" className="me-2" onClick={() => null} />
      <Button
        label={initialMapping ? 'Update Setting' : 'Confirm'}
        variant="primary"
        prefixIcon="Check"
        onClick={() => null}
      />
    </div>
  )
}
