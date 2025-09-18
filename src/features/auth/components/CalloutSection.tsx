'use client'

import { Callout } from '@/components/ui/Callout'
import { useAppState } from '@/context/AppStateContext'

export const CalloutSection = () => {
  const { user, connectionStatus } = useAppState()

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
        }}
        hrefUrl={`/auth/initiate?token=${user.token}`}
      />
    )

  return <div className="text-2xl">Connected!</div>
}
