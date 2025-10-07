'use client'

import { useAuthContext } from '@auth/hooks/useAuth'
import { useSettingsContext } from '@settings/hooks/useSettings'
import { Checkbox } from 'copilot-design-system'
import { getWorkspaceLabel } from '@/utils/workspace'

export const InvoiceDetails = () => {
  const { workspace } = useAuthContext()
  const { addAbsorbedFees, useCompanyName, updateSettings } = useSettingsContext()

  return (
    <div className="mt-2 mb-6">
      <div className="mb-5">
        <Checkbox
          label="Add absorbed fees to an Expense Account in Xero"
          description="Record Assembly processing fees as expenses in the 'Assembly Processing Fees' expense account in Xero."
          checked={addAbsorbedFees}
          onChange={() => updateSettings({ addAbsorbedFees: !addAbsorbedFees })}
        />
      </div>
      <div className="mb-5">
        <Checkbox
          label={`Use ${getWorkspaceLabel(workspace, 'groupTerm')} name when syncing invoices billed to ${getWorkspaceLabel(workspace, 'groupTermPlural')}`}
          description={`\
            Create Xero customers using the ${getWorkspaceLabel(workspace, 'groupTerm')} \
            name rather than individual ${getWorkspaceLabel(workspace, 'individualTerm')} names when invoices are billed to \
            ${getWorkspaceLabel(workspace, 'groupTermPlural')}.\
            `}
          checked={useCompanyName}
          onChange={() => updateSettings({ useCompanyName: !useCompanyName })}
        />
      </div>
    </div>
  )
}
