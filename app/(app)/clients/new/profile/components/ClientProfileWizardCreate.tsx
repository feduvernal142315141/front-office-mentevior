"use client"

import { ClientProfileWizard } from "../../../[id]/profile/components/ClientProfileWizard"

export function ClientProfileWizardCreate() {
  return <ClientProfileWizard clientId="new" isCreateMode={true} />
}
