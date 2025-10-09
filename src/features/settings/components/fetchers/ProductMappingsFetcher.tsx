import SyncedItemsService from '@items-sync/lib/SyncedItems.service'
import type { ProductMapping } from '@items-sync/types'
import { SettingsContextSetter } from '@settings/context/SettingsContextSetter'
import type { XeroConnection, XeroConnectionWithTokenSet } from '@/db/schema/xeroConnections.schema'
import type User from '@/lib/copilot/models/User.model'

const getProductMappings = async (
  user: User,
  connection: XeroConnection,
): Promise<ProductMapping[]> => {
  if (!connection.tenantId) return []

  const syncedItemsService = new SyncedItemsService(user, connection as XeroConnectionWithTokenSet)
  return await syncedItemsService.getProductMappings()
}

interface ProductMappingsFetcherProps {
  user: User
  connection: XeroConnection
}

export const ProductMappingsFetcher = async ({ user, connection }: ProductMappingsFetcherProps) => {
  const productMappings = await getProductMappings(user, connection)
  return <SettingsContextSetter productMappings={productMappings} />
}
