'use server'

import ProductMappingsService from '@settings/lib/ProductMappings.service'
import status from 'http-status'
import APIError from '@/errors/APIError'
import AuthService from '@/features/auth/lib/Auth.service'
import type { ProductMapping } from '@/features/items-sync/types'
import User from '@/lib/copilot/models/User.model'

export const updateSyncedItemsAction = async (token: string, productMappings: ProductMapping[]) => {
  const user = await User.authenticate(token)

  const authService = new AuthService(user)
  const connection = await authService.authorizeXeroForCopilotWorkspace()

  if (!connection.tenantId)
    throw new APIError('Cannot update synced items for unauthorized portal', status.UNAUTHORIZED)

  const productMappingsService = new ProductMappingsService(user, connection)
  return await productMappingsService.updateMappedItems(
    productMappings.map((mapping) => ({
      productId: mapping.product.id,
      priceId: mapping.price.id,
      itemId: mapping.item?.itemID || null,
    })),
  )
}
