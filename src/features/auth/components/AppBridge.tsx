'use client'

import { useAppBridge } from '@settings/hooks/useAppMenu'

interface AppMenuTriggerProps {
  token: string
}

export const AppMenuTrigger = ({ token }: AppMenuTriggerProps) => {
  useAppBridge({ token })

  return null
}
