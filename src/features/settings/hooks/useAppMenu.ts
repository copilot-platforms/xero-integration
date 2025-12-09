'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { disconnectApp } from '@settings/actions/disconnectApp'
import { useSettingsContext } from '@settings/hooks/useSettings'
import { useState } from 'react'
import { useActionsMenu } from '@/lib/copilot/hooks/app-bridge'
import { Icons } from '@/lib/copilot/hooks/app-bridge/types'

export const useAppBridge = ({ token }: { token: string }) => {
  const { connectionStatus } = useAuthContext()
  const { isSyncEnabled, updateSettings, initialSettings } = useSettingsContext()

  const _disconnectAppAction = async () => {
    await disconnectApp(token)
    updateSettings({
      isSyncEnabled: false,
      initialSettings: { ...initialSettings, isSyncEnabled: false },
    })
  }

  // biome-ignore lint/suspicious/useAwait: there is no async action being done here but the type signature requires it
  const _downloadCsvAction = async () => {
    const url = `/api/sync-logs?token=${token}`
    const link = document.createElement('a')
    link.href = url
    link.download = 'sync-history.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const [disconnectAppAction, setDisconnectAppAction] = useState(() => _disconnectAppAction)
  const [downloadCsvAction, setDownloadCsvAction] = useState(() => _downloadCsvAction)

  setTimeout(() => {
    setDisconnectAppAction(() => _disconnectAppAction)
    setDownloadCsvAction(() => _downloadCsvAction)
  }, 0)

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
