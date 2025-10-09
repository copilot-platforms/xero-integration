import { Icon } from 'copilot-design-system'
import type { ProductMapping } from '@/features/items-sync/types'

interface ProductMappingTableRowProps {
  item: ProductMapping
}

export const ProductMappingTableRow = ({ item }: ProductMappingTableRowProps) => {
  return (
    <tr key={item.price.id} className="transition-colors">
      {/* Assembly Products Column */}
      <td className="py-2 pr-3 pl-4">
        <div className="break-all text-sm text-text-primary leading-5 lg:break-normal">
          {item.product.name}
        </div>
        <div className="text-body-xs text-text-secondary leading-5">${item.price.amount / 100}</div>
      </td>

      {/* Arrow Column */}
      <td className="border-gray-200 border-l text-center">
        <Icon icon="ArrowRight" width={16} height={16} className="mx-auto text-gray-500" />
      </td>

      {/* Xero Items Column */}
      <td className="relative border-gray-200 border-l bg-gray-100 hover:bg-gray-150">
        <button
          type="button"
          // ref={setButtonRef(index)}
          onClick={() => null}
          className="grid h-full w-full grid-cols-6 py-2 pr-3 pl-4 transition-colors md:grid-cols-14"
        >
          <div className="col-span-5 text-left md:col-span-13">
            {/* {selectedItems[index] && Object.keys(selectedItems[index]).length > 0 ? (
                        <div className="text-left">
                          <div className="break-all text-gray-600 text-sm leading-5 lg:break-normal">
                            {selectedItems[index].name}
                          </div>
                          <div className="text-body-xs text-gray-500 leading-5">
                            {selectedItems[index].price}
                          </div>
                        </div>
                      ) : (
                        <MapItemComponent
                          mappingItems={mappingItems}
                          productId={product.id}
                          priceId={product.priceId}
                        />
                      )} */}
            <div>Map item</div>
          </div>
          <div className="col-span-1 my-auto ml-auto">
            <Icon icon="ChevronDown" width={16} height={16} className={`text-gray-500`} />
          </div>
        </button>

        {false && (
          <div
            // ref={dropdownRef}
            className="!shadow-popover-050 absolute top-full right-[-1px] left-[-145px] z-100 mt-[-4px] rounded-sm border border-gray-150 bg-white md:left-[-1px] md:min-w-[320px]"
          >
            <div className="px-3 py-2">
              <input
                type="text"
                placeholder="Search"
                value={''}
                onChange={() => null}
                className="w-full text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div className="border-card-divider border-t-1 border-b-1 hover:bg-gray-100">
              <button
                type="button"
                className="h-full w-full cursor-pointer px-3 py-2 text-left text-gray-600 text-sm"
                onClick={() => null}
              >
                Exclude from mapping
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {/* {items && (
                <button
                  type="button"
                  key={'a'}
                  className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-100"
                >
                  <span className="line-clamp-1 break-all text-gray-600 lg:break-normal">
                    {item.product.name}
                  </span>
                  <span className="text-body-micro text-gray-500 leading-body-micro">
                    {item.price.amount}
                  </span>
                </button>
              )} */}
              {false && <div className="px-3 py-2 text-gray-500 text-sm">No items found</div>}
            </div>
          </div>
        )}
      </td>
    </tr>
  )
}
