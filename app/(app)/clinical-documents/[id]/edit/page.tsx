"use client"

import { useParams } from "next/navigation"
import { Loader2, Stethoscope } from "lucide-react"
import { useClinicalDocumentById } from "@/lib/modules/clinical-documents/hooks/use-clinical-document-by-id"
import { ClinicalDocumentEditForm } from "./components/ClinicalDocumentEditForm"

export default function EditClinicalDocumentPage() {
  const params = useParams()
  const id = params.id as string

  const { data: document, isLoading, error } = useClinicalDocumentById(id)

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-600 font-medium">Error loading document</p>
            <p className="text-red-500 text-sm mt-1">
              {error?.message || "Document not found"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">          

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Stethoscope className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Edit Clinical Document
              </h1>
              <p className="text-slate-600 mt-1">{document.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <ClinicalDocumentEditForm document={document} />
        </div>
      </div>
    </div>
  )
}
