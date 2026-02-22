"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { useUpdateClinicalDocument } from "@/lib/modules/clinical-documents/hooks/use-update-clinical-document"
import type { ClinicalDocument, UpdateClinicalDocumentDto } from "@/lib/types/clinical-document.types"

interface ClinicalDocumentEditFormProps {
  document: ClinicalDocument
}

export function ClinicalDocumentEditForm({ document }: ClinicalDocumentEditFormProps) {
  const router = useRouter()
  const [name, setName] = useState(document.name || "")
  const [issuedDate, setIssuedDate] = useState(document.issuedDate)
  const [expirationDate, setExpirationDate] = useState(document.expirationDate)
  const [status, setStatus] = useState(document.status)

  const updateMutation = useUpdateClinicalDocument()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    const payload: UpdateClinicalDocumentDto = {
      id: document.id,
      name: name.trim(),
      documentCategory: "CLINICAL",
      issuedDate,
      expirationDate,
      uploadFile: true,
      downloadFile: true,
      status,
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        router.push("/clinical-documents")
      },
    })
  }

  const handleCancel = () => {
    router.push("/clinical-documents")
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <FloatingInput
              label="Document Name"
              value={name}
              onChange={setName}
              onBlur={() => {}}
              placeholder="Enter document name..."
              required
              disabled={document.isFromCatalog}
            />
            {document.isFromCatalog && (
              <p className="text-xs text-gray-500 mt-1">
                Document name from catalog (cannot be edited)
              </p>
            )}
          </div>

          <div>
            <FloatingInput
              label="Category"
              value="CLINICAL"
              onChange={() => {}}
              onBlur={() => {}}
              disabled
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-6" />

        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Field Configuration</h3>
            <p className="text-sm text-gray-600">
              Configure which fields will be available in the user/provider dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <PremiumSwitch
                checked={issuedDate}
                onCheckedChange={setIssuedDate}
                label="Issued Date"
                description="Allow users to specify when issued"
              />
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <PremiumSwitch
                checked={expirationDate}
                onCheckedChange={setExpirationDate}
                label="Expiration Date"
                description="Allow users to specify when expires"
              />
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <PremiumSwitch
                checked={true}
                onCheckedChange={() => {}}
                label="Upload File"
                description="Allow users to upload files"
                disabled
              />
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <PremiumSwitch
                checked={true}
                onCheckedChange={() => {}}
                label="Download File"
                description="Allow users to download files"
                disabled
              />
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors md:col-span-2">
              <PremiumSwitch
                checked={status}
                onCheckedChange={setStatus}
                label="Status"
                description="Show document status field (e.g., Pending, Approved, Rejected)"
              />
            </div>
          </div>
        </div>
      </div>

      <FormBottomBar
        isSubmitting={updateMutation.isPending}
        onCancel={handleCancel}
        submitText="Save Changes"
        disabled={!name.trim()}
      />
    </form>
  )
}
