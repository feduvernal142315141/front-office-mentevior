"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { useCreateHRDocument } from "@/lib/modules/hr-documents/hooks/use-create-hr-document"
import type { CreateHRDocumentDto } from "@/lib/types/hr-document.types"

interface HRDocumentCreateFormProps {
  mode: "catalog" | "manual"
  catalogId?: string
  initialDocumentName?: string
}

export function HRDocumentCreateForm({ mode, catalogId, initialDocumentName }: HRDocumentCreateFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialDocumentName || "")
  const [issuedDate, setIssuedDate] = useState(true)
  const [expirationDate, setExpirationDate] = useState(true)
  const [uploadFile, setUploadFile] = useState(true)
  const [downloadFile, setDownloadFile] = useState(true)
  const [status, setStatus] = useState(true)

  const createMutation = useCreateHRDocument()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    const payload: CreateHRDocumentDto = {
      name: name.trim(),
      documentCategory: "HR",
      issuedDate,
      expirationDate,
      uploadFile,
      downloadFile,
      status,
      ...(catalogId && { catalogId }),
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        router.push("/hr-documents")
      },
    })
  }

  const handleCancel = () => {
    router.push("/hr-documents")
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
              disabled={mode === "catalog"}
            />
            {mode === "catalog" && (
              <p className="text-xs text-gray-500 mt-1">
                Document name from catalog (cannot be edited)
              </p>
            )}
          </div>

          <div>
            <FloatingInput
              label="Category"
              value="HR"
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
                checked={uploadFile}
                onCheckedChange={setUploadFile}
                label="Upload File"
                description="Allow users to upload files"
              />
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <PremiumSwitch
                checked={downloadFile}
                onCheckedChange={setDownloadFile}
                label="Download File"
                description="Allow users to download files"
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
        isSubmitting={createMutation.isPending}
        onCancel={handleCancel}
        submitText="Create Document"
        disabled={!name.trim()}
      />
    </form>
  )
}
