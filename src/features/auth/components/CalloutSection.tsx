'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { Callout } from '@/components/ui/Callout'

export const CalloutSection = () => {
  const { user, connectionStatus } = useAuthContext()

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

  return null
}
