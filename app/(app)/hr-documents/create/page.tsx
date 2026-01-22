"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {  Loader2, FolderOpen } from "lucide-react"
import { HRDocumentCreateForm } from "./components/HRDocumentCreateForm"

function CreateHRDocumentContent() {
  const searchParams = useSearchParams()
  
  const mode = searchParams.get("mode") as "catalog" | "manual" | null
  const catalogId = searchParams.get("catalogId")
  const documentName = searchParams.get("name")

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">          

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <FolderOpen className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                {mode === "catalog" ? "Add HR Document from Catalog" : "Create HR Document"}
              </h1>
              <p className="text-slate-600 mt-1">
                {mode === "catalog" 
                  ? "Configure document settings from catalog" 
                  : "Create a custom HR document configuration"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <HRDocumentCreateForm
            mode={mode || "manual"}
            catalogId={catalogId || undefined}
            initialDocumentName={documentName || undefined}
          />
        </div>
      </div>
    </div>
  )
}

export default function CreateHRDocumentPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    }>
      <CreateHRDocumentContent />
    </Suspense>
  )
}
