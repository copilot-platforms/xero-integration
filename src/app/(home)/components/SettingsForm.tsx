'use client'

import { Heading } from 'copilot-design-system'
import Divider from '@/components/layouts/Divider'

export const SettingsForm = () => {
  return (
    <div className="mt-6 mb-2">
      <Heading size="xl" tag="h2" className="!leading-7 border-b-1 border-b-card-divider pb-4">
        Settings
      </Heading>
      <Divider />
    </div>
  )
}
