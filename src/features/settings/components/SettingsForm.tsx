'use client'

import { InvoiceDetails } from '@settings/components/InvoiceDetails'
import { ProductMapping } from '@settings/components/ProductMapping'
import { Heading } from 'copilot-design-system'
import Divider from '@/components/layouts/Divider'
import Accordion from '@/components/ui/Accordion'
import { ConfirmSettings } from '@/features/settings/components/ConfirmSettings'

export const SettingsForm = () => {
  return (
    <div className="settings-form-container mt-6 mb-2">
      <Heading size="xl" tag="h2" className="!leading-7 border-b-1 border-b-card-divider pb-4">
        Settings
      </Heading>

      <Divider />

      <form className="settings-form mt-2">
        <Accordion
          title="Product Mapping"
          content=<ProductMapping />
          extra=<ConfirmSettings mode="product" />
        />

        <Divider />

        <Accordion
          title="Invoice Details"
          content=<InvoiceDetails />
          extra=<ConfirmSettings mode="invoice" />
        />
      </form>
    </div>
  )
}
