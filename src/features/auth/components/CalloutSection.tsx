'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { Callout } from 'copilot-design-system'
import { updateSettingsAction } from '@/features/settings/actions/settings'
import { useSettingsContext } from '@/features/settings/hooks/useSettings'

export const CalloutSection = () => {
  const { user, connectionStatus } = useAuthContext()
  const {
    isSyncEnabled,
    initialInvoiceSettingsMapping,
    initialProductSettingsMapping,
    initialSettings,
    updateSettings,
  } = useSettingsContext()

  if (!connectionStatus)
    return (
      <Callout
        title={'Authorize your account'}
        description={'Log into Xero with an admin account to get started.'}
        variant={'info'}
        actionProps={{
          variant: 'primary',
          label: 'Connect to Xero',
          prefixIcon: 'Check',
          onClick: (_e: unknown) => {
            window.open(`/auth/initiate?token=${user.token}`, '_blank', 'noopener,noreferrer')
          },
        }}
      />
    )

  if (!isSyncEnabled)
    return (
      <Callout
        title={'Confirm your mapping before getting started.'}
        description={
          'Set your product mappings and review configuration settings to best set up your sync.'
        }
        variant={'warning'}
        actionProps={{
          variant: 'primary',
          label: 'Enable app',
          prefixIcon: 'Check',
          disabled: !(initialInvoiceSettingsMapping && initialProductSettingsMapping),
          onClick: async (_e: unknown) => {
            const newSettings = await updateSettingsAction(user.token, { isSyncEnabled: true })
            updateSettings({
              ...newSettings,
              initialSettings: { ...initialSettings, ...newSettings },
            })
          },
        }}
      />
    )

  return null
}
