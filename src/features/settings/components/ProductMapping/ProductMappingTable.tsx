'use client'

import type SyncedItemsService from '@items-sync/lib/SyncedItems.service'
import { Icon } from 'copilot-design-system'
import { ProductMappingTableRow } from './ProductMappingTableRow'

interface ProductMappingTableProps {
  items?: Awaited<ReturnType<SyncedItemsService['getProductMappings']>>
}

export const ProductMappingTable = ({ items }: ProductMappingTableProps) => {
  if (!items) return <div>Loading...</div>

  return (
    <div className="product-mapping-table mt-5 border border-gray-200 bg-white text-left">
      <table className="w-full">
        <thead>
          <tr className="border-gray-200 border-b">
            <th className="w-[46.5%] pt-5 pr-3 pb-2 pl-4 font-normal text-[11px] uppercase leading-3 tracking-[1px] lg:w-[372px]">
              ASSEMBLY PRODUCTS
            </th>

            <th className="w-[7%] border-gray-200 border-l px-5 pt-3 pb-[6px] lg:w-[56px]">
              <div className="flex w-full justify-center text-center">
                <Icon icon="ArrowRight" width={16} height={16} className="text-gray-500" />
              </div>
            </th>
            <th className="w-[46.5%] border-gray-200 border-l pt-5 pr-3 pb-2 pl-4 text-left font-normal text-[11px] uppercase leading-3 tracking-[1px] lg:w-[372px]">
              XERO ITEMS
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {items.length ? (
            items.map((item) => <ProductMappingTableRow key={item.price.id} item={item} />)
          ) : (
            <tr className="text-center">
              <td colSpan={3} className="py-11">
                Start by creating a product in Assembly.
                <button
                  type="button"
                  onClick={() => null}
                  className="ms-2 cursor-pointer text-blue-300"
                >
                  Create Product
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
