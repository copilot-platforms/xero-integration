import BaseService from '@/lib/copilot/services/base.service'
import type { CopilotPrice, CopilotProduct } from '@/lib/copilot/types'

/**
 * const data = { id, name, value }[]
 * const dataMap = { [id]: data }
 * data.find(d => d.id === myId)
 * da
 */

/**
 * Service class to interact with Copilot Products + Prices
 */
class CopilotProductsService extends BaseService {
  /**
   * Returns an object with product ID as key and product as value
   * @param productIds Products to get details for
   */
  async getCopilotProducts(productIds: string[]): Promise<Record<string, CopilotProduct>> {
    const allProducts = await this.copilot.getProducts()

    return allProducts.reduce<Record<string, CopilotProduct>>((acc, product) => {
      if (productIds.includes(product.id)) {
        acc[product.id] = product
      }
      return acc
    }, {})
  }

  /**
   * Returns an object with price ID as key and price as value
   * @param priceIds Prices to get details for
   */
  async getCopilotPrices(priceIds: string[]): Promise<Record<string, CopilotPrice>> {
    const allPrices = await this.copilot.getPrices()
    return allPrices.reduce<Record<string, CopilotPrice>>((acc, price) => {
      if (priceIds.includes(price.id)) {
        acc[price.id] = price
      }
      return acc
    }, {})
  }
}

export default CopilotProductsService
