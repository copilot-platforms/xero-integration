'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { updateSettingsAction } from '@settings/actions/settings'
import { updateSyncedItemsAction } from '@settings/actions/syncedItems'
import type { SettingsContextType } from '@settings/context/SettingsContext'
import { useSettingsContext } from '@settings/hooks/useSettings'
import { Button } from 'copilot-design-system'
import isDeepEqual from 'deep-equal'
import { useState } from 'react'

interface ConfirmSettingsProps {
  mode: 'product' | 'invoice'
}

export const ConfirmSettings = ({ mode }: ConfirmSettingsProps) => {
  const {
    initialSettings,
    initialProductSettingsMapping,
    initialInvoiceSettingsMapping,
    syncProductsAutomatically,
    productMappings,
    addAbsorbedFees,
    useCompanyName,
    updateSettings,
  } = useSettingsContext()

  const { user, tenantId } = useAuthContext()

  const [isPending, setIsPending] = useState(false)

  const [initialMapping, showButtons] =
    mode === 'product'
      ? [
          initialProductSettingsMapping,
          syncProductsAutomatically !== initialSettings.syncProductsAutomatically ||
            !isDeepEqual(productMappings, initialSettings.productMappings),
        ]
      : [
          initialInvoiceSettingsMapping,
          addAbsorbedFees !== initialSettings.addAbsorbedFees ||
            useCompanyName !== initialSettings.useCompanyName,
        ]

  const onConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!tenantId) return null

    setIsPending(true)
    try {
      // --- Apply confirm / update action for Product section of the form
      if (mode === 'product') {
        updateSettings({ initialProductSettingsMapping: true })

        const [newSettings, newMappings] = await Promise.all([
          updateSettingsAction(user.token, {
            syncProductsAutomatically,
            initialProductSettingsMapping: true,
          }),
          updateSyncedItemsAction(user.token, productMappings),
        ])
        updateSettings({
          initialSettings: {
            ...initialSettings,
            ...newSettings,
            productMappings: newMappings,
          },
          ...newSettings,
          productMappings: newMappings,
        })
      } else {
        updateSettings({ initialInvoiceSettingsMapping: true })

        // --- Apply confirm action for Invoice section of the form
        const newSettings = await updateSettingsAction(user.token, {
          addAbsorbedFees,
          useCompanyName,
          initialInvoiceSettingsMapping: true,
        })
        updateSettings({
          initialSettings: {
            ...initialSettings,
            ...newSettings,
          },
          ...newSettings,
        })
      }
    } catch (e) {
      // We can dispatch an error toast here
      console.error(e)
    } finally {
      setIsPending(false)
    }
  }

  const onCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const resetPayload: Partial<SettingsContextType> =
      mode === 'product'
        ? {
            syncProductsAutomatically: initialSettings.syncProductsAutomatically,
            productMappings: initialSettings.productMappings,
          }
        : {
            addAbsorbedFees: initialSettings.addAbsorbedFees,
            useCompanyName: initialSettings.useCompanyName,
          }
    updateSettings(resetPayload)
  }

  if ((initialMapping && !showButtons) || isPending) return null

  return (
    <div className="flex max-h-6 select-none items-center justify-end">
      <Button
        label="Cancel"
        type="reset"
        variant="text"
        className="me-2"
        onMouseUp={onCancel}
        disabled={isPending}
      />
      <Button
        label={initialMapping ? 'Update Setting' : 'Confirm'}
        variant="primary"
        prefixIcon="Check"
        onMouseUp={onConfirm}
        disabled={isPending}
      />
    </div>
  )
}
