'use client'

import { Heading, Icon } from 'copilot-design-system'
import type { ReactElement } from 'react'

type AccordionProps = {
  item: {
    id: string
    header: string
    content: ReactElement
  }
  toggleItemAction: (itemId: string) => void
  isOpen: boolean
}

export default function Accordion({ item, toggleItemAction, isOpen }: AccordionProps) {
  return (
    <div className="mx-auto">
      <button
        type="button"
        className="flex cursor-pointer items-center justify-start py-[14px] pr-3"
        onClick={() => toggleItemAction(item.id)}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${item.id}`}
      >
        <Heading size="lg">{item.header}</Heading>
        {/* Chevron rotates based on open state */}
        <div
          className={`transform p-1.5 transition-transform duration-150 ease-in-out ${
            isOpen ? 'rotate-90' : ''
          }`}
        >
          <Icon icon="ChevronRight" width={16} height={16} />
        </div>
      </button>

      {/* Content - Conditionally visible with smooth animation */}
      <div
        id={`accordion-content-${item.id}`}
        className={`slide-in-from-top-2 animate-in duration-200 ${isOpen ? 'block' : 'hidden'}`}
      >
        {item.content}
      </div>
    </div>
  )
}
