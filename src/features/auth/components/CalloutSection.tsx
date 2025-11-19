'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { updateSettingsAction } from '@settings/actions/settings'
import { useSettingsContext } from '@settings/hooks/useSettings'
import { Callout } from 'copilot-design-system'
import { timeAgo } from '@/utils/date'

export const CalloutSection = () => {
  const { user, connectionStatus, needsReconnection, lastSyncedAt } = useAuthContext()
  const {
    isSyncEnabled,
    initialInvoiceSettingsMapping,
    initialProductSettingsMapping,
    initialSettings,
    updateSettings,
  } = useSettingsContext()

  if (needsReconnection) {
    return (
      <Callout
        title={'Sync failed'}
        description={'Please reauthorize your account to reconnect with Xero.'}
        variant={'error'}
        actionProps={{
          variant: 'primary',
          label: 'Reauthorize',
          prefixIcon: 'Repeat',
          onClick: (_e: unknown) => {
            window.open(`/auth/initiate?token=${user.token}`, '_blank', 'noopener,noreferrer')
          },
        }}
      />
    )
  }

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

  if (lastSyncedAt)
    return (
      <Callout
        title={'Xero sync is live'}
        description={`Last synced ${timeAgo(new Date(lastSyncedAt))}`}
        variant={'success'}
      />
    )
}
