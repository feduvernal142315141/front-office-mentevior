"use client"

import { useEffect } from "react"
import { RequiredDocumentsOverview } from "../../../components/required-documents/RequiredDocumentsOverview"
import type { StepComponentProps } from "@/lib/types/wizard.types"

interface Step10RequiredDocumentsProps extends StepComponentProps {
  onDocumentsAlertChange?: (count: number) => void
}

export function Step10RequiredDocuments({
  clientId,
  client,
  isCreateMode,
  onSaveSuccess,
  registerSubmit,
  registerValidation,
  onProgressUpdate,
  onDocumentsAlertChange,
}: Step10RequiredDocumentsProps) {
  
  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({})
    })
  }, [registerSubmit, onSaveSuccess])

  if (isCreateMode) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <p className="text-amber-700 font-medium">
          Please save the client first before managing required documents.
        </p>
      </div>
    )
  }

  return (
    <div className="px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Required Documents</h2>
        <p className="text-slate-600 mt-1">
          Manage and upload required documents for this client
        </p>
      </div>

      <RequiredDocumentsOverview
        isActive={true}
        clientId={clientId}
        onPendingCountChange={onDocumentsAlertChange}
        onProgressUpdate={onProgressUpdate}
      />
    </div>
  )
}
