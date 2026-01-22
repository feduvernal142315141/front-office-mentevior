"use client"

import { useState, useRef } from "react"
import { Plus, FolderOpen } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { HRDocumentsTable, type HRDocumentsTableRef } from "./components/HRDocumentsTable"
import { HRDocumentDrawer } from "./components/HRDocumentDrawer"

export default function HRDocumentsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const tableRef = useRef<HRDocumentsTableRef>(null)

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
              <FolderOpen className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                HR Documents
              </h1>
              <p className="text-slate-600 mt-1">Configure required documents for user onboarding</p>
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

        <HRDocumentsTable ref={tableRef} />

        <HRDocumentDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
