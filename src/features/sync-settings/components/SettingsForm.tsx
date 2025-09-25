'use client'

import { Heading } from 'copilot-design-system'
import Divider from '@/components/layouts/Divider'
import Accordion from '@/components/ui/Accordion'

export const SettingsForm = () => {
  return (
    <div className="mt-6 mb-2">
      <Heading size="xl" tag="h2" className="!leading-7 border-b-1 border-b-card-divider pb-4">
        Settings
      </Heading>
      <Divider />
      <Accordion
        item={{
          id: 'sync-settings',
          header: 'Sync Settings',
          content: <div>Sync Settings</div>,
        }}
        toggleItemAction={() => {
          return undefined
        }}
        isOpen={false}
      />
    </div>
  )
}
