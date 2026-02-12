"use client"

import type { ReactNode } from "react"
import { CredentialsForm } from "./CredentialsForm"
import { CredentialsTable } from "./CredentialsTable"
import { Button } from "@/components/custom/Button"
import type {
  UserCredential,
  UserCredentialTypeOption,
  CreateUserCredentialDto,
  UpdateUserCredentialDto,
} from "@/lib/types/user-credentials.types"

interface CredentialsSectionProps {
  roleName: string
  canManageCredentials: boolean
  credentials: UserCredential[]
  credentialTypes: UserCredentialTypeOption[]
  isLoadingTypes: boolean
  editingCredential: UserCredential | null
  isFormOpen: boolean
  onSave: (data: CreateUserCredentialDto) => Promise<void>
  onUpdate: (id: string, data: UpdateUserCredentialDto) => Promise<void>
  onCancelEdit: () => void
  onEdit: (credential: UserCredential) => void
  onAdd: () => void
  isSaving: boolean
  getComputedStatus: (expirationDate: string) => "Active" | "Expired"
  signatureSection?: ReactNode
}

export function CredentialsSection({
  roleName,
  canManageCredentials,
  credentials,
  credentialTypes,
  isLoadingTypes,
  editingCredential,
  isFormOpen,
  onSave,
  onUpdate,
  onCancelEdit,
  onEdit,
  onAdd,
  isSaving,
  getComputedStatus,
  signatureSection,
}: CredentialsSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Credentials</h3>
          <p className="text-sm text-gray-600">
            Professional credentials available for this tenant and user role.
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
          Role: {roleName}
        </div>
      </div>

      <div className="space-y-7">
        <CredentialsTable
          data={credentials}
          onEdit={onEdit}
        />

        {isFormOpen && (
          <CredentialsForm
            credentialTypes={credentialTypes}
            isLoadingTypes={isLoadingTypes}
            editingCredential={editingCredential}
            onSave={onSave}
            onUpdate={onUpdate}
            onCancelEdit={onCancelEdit}
            isSaving={isSaving}
            getComputedStatus={getComputedStatus}
          />
        )}

        {!isFormOpen && credentials.length === 0 && (
          <div className="flex justify-end">
            <Button onClick={onAdd}>Add Credential</Button>
          </div>
        )}

        {signatureSection && (
          <div className="pt-2">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/70 to-transparent mb-5" />
            {signatureSection}
          </div>
        )}
      </div>
    </section>
  )
}
