'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { Heading, Icon } from 'copilot-design-system'
import { type ReactElement, useState } from 'react'

type AccordionFormProps = {
  title: string
  content: ReactElement
  extra?: ReactElement | null
}

export default function Accordion({ title, content, extra = null }: AccordionFormProps) {
  const { connectionStatus } = useAuthContext()
  const [isOpen, setIsOpen] = useState(connectionStatus)
  const itemId = title.toLowerCase().replaceAll(' ', '-')

  const handleAccordionClick = () => {
    connectionStatus && setIsOpen((prev) => !prev)
  }

  return (
    <div className={`mx-auto ${connectionStatus ? '' : 'opacity-50'}`}>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: Need to nest buttons inside its children */}
      <div
        className="flex w-full cursor-auto items-center justify-between py-[14px] pr-3"
        onMouseUp={handleAccordionClick}
      >
        <div className="flex cursor-pointer items-center justify-between">
          <Heading size="lg">{title}</Heading>
          {/* Chevron rotates based on open state */}
          <div
            className={`transform p-1.5 transition-transform duration-150 ease-in-out ${
              isOpen ? 'rotate-90' : ''
            }`}
          >
            <Icon icon="ChevronRight" width={16} height={16} />
          </div>
        </div>
        <div className="relative right-0">{extra}</div>
      </div>

      <div
        id={`accordion-content-${itemId}`}
        className={`slide-in-from-top-2 animate-in duration-200 ${isOpen ? 'block' : 'hidden'} pt-2 pb-6`}
      >
        {content}
      </div>
    </div>
  )
}
