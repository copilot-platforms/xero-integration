import 'server-only'

import z from 'zod'
import type { XeroConnection } from '@/db/schema/xeroConnections.schema'
import { copilotBottleneck } from '@/lib/copilot/bottleneck'
import type User from '@/lib/copilot/models/User.model'
import logger from '@/lib/logger'

export const sendAuthorizationFailedNotification = async (
  user: User,
  connection?: XeroConnection,
  e?: unknown,
) => {
  const internalUsers = await user.copilot.getInternalUsers()

  const notificationPromises = []

  for (const internalUser of internalUsers.data) {
    const senderId = z.uuid().parse(user.internalUserId ?? connection?.initiatedBy)
    const promise = user.copilot.createNotification({
      senderId,
      senderType: 'internalUser',
      recipientInternalUserId: internalUser.id,
      deliveryTargets: {
        inProduct: {
          title: 'Xero Integration Has Stopped Working',
          body: 'Your Xero integration encountered an error and has stopped syncing. Please reconnect to avoid any disruptions.',
        },
        email: {
          header: 'Your Xero Sync has stopped working',
          subject: 'Your Xero Sync has stopped working',
          body: 'Your Xero integration encountered an error and has stopped syncing. Please reconnect to avoid any disruptions.',
          title: 'Reconnect Xero',
        },
      },
    })
    notificationPromises.push(copilotBottleneck.schedule(() => promise))
  }

  await Promise.all(notificationPromises)

  if (e && e instanceof Error) {
    logger.error(
      'XeroConection.helpers#sendAuthorizationFailedNotification :: Xero authorization failed:',
      e,
    )
  }
}
