import BaseService from '@/lib/copilot/services/base.service'
import type { CopilotPrice, CopilotProduct } from '@/lib/copilot/types'

/**
 * Service class to interact with Copilot Products + Prices
 */
class CopilotProductsService extends BaseService {
  async getCopilotProducts(productIds: string[]): Promise<CopilotProduct[]> {
    const allProducts = await this.copilot.getProducts()
    return allProducts.filter((product) => productIds.includes(product.id))
  }

  async getCopilotPrices(productIds: string[]): Promise<CopilotPrice[]> {
    const allPrices = await this.copilot.getPrices()
    return allPrices.filter((price) => productIds.includes(price.productId))
  }
}

export default CopilotProductsService
