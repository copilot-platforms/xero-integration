'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { updateSettingsAction } from '@settings/actions/settings'
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
    updateSettings,
  } = useSettingsContext()

  const { user, tenantId } = useAuthContext()

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

  const onConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!tenantId) return null

    const payload =
      mode === 'product' ? { syncProductsAutomatically } : { addAbsorbedFees, useCompanyName }

    const newValues = await updateSettingsAction(user.token, tenantId, payload)
    updateSettings({ initialSettings: newValues })
  }

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="flex max-h-6 items-center justify-end">
      <Button label="Cancel" variant="text" className="me-2" onMouseUp={stopPropagation} />
      <Button
        label={initialMapping ? 'Update Setting' : 'Confirm'}
        variant="primary"
        prefixIcon="Check"
        onMouseUp={onConfirm}
      />
    </div>
  )
}
