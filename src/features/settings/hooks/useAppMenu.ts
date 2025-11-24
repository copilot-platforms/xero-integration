'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { disconnectApp } from '@settings/actions/disconnectApp'
import { useSettingsContext } from '@settings/hooks/useSettings'
import { useActionsMenu } from '@/lib/copilot/hooks/app-bridge'
import { Icons } from '@/lib/copilot/hooks/app-bridge/types'

export const useAppBridge = ({ token }: { token: string }) => {
  const { connectionStatus } = useAuthContext()
  const { isSyncEnabled, updateSettings, initialSettings } = useSettingsContext()

  const disconnectAppAction = async () => {
    await disconnectApp(token)
    updateSettings({
      isSyncEnabled: false,
      initialSettings: { ...initialSettings, isSyncEnabled: false },
    })
  }

  const downloadCsvAction = async () => {
    // TODO: In another ticket. Keeping async console.log because the type signature on onClick is for a Promsie
    await console.info('Downloading...')
  }

  let actions: { label: string; icon?: Icons; onClick: () => Promise<void> }[] = []
  if (connectionStatus) {
    actions = [
      {
        label: 'Download sync history',
        icon: Icons.DOWNLOAD,
        onClick: downloadCsvAction,
      },
    ]

    if (isSyncEnabled) {
      actions.push({
        label: 'Disconnect account',
        icon: Icons.DISCONNECT,
        onClick: disconnectAppAction,
      })
    }
  }

  useActionsMenu(actions)
}
