"use client"

import { useState, useRef } from "react"
import { Plus, Stethoscope } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { ClinicalDocumentsTable, type ClinicalDocumentsTableRef } from "./components/ClinicalDocumentsTable"
import { ClinicalDocumentDrawer } from "./components/ClinicalDocumentDrawer"

export default function ClinicalDocumentsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const tableRef = useRef<ClinicalDocumentsTableRef>(null)

  const handleSuccess = () => {
    setIsDrawerOpen(false)
    tableRef.current?.refetch()
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Stethoscope className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Clinical Documents
              </h1>
              <p className="text-slate-600 mt-1">Configure required clinical documents for patient profiles</p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsDrawerOpen(true)}
            className="gap-2 flex items-center"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </Button>
        </div>

        <ClinicalDocumentsTable ref={tableRef} />

        <ClinicalDocumentDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
