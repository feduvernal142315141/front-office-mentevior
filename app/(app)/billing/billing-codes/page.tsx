"use client"

import { useState } from "react"
import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { useRouter } from "next/navigation"
import { BillingCodesTable } from "./components/BillingCodesTable"
import { BillingCodeDrawer } from "./components/BillingCodeDrawer"

export default function BillingCodesPage() {
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleSuccess = () => {
    setIsDrawerOpen(false)
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <FileText className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Billing Codes
              </h1>
              <p className="text-slate-600 mt-1">Manage codes for your organization</p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsDrawerOpen(true)}
            className="gap-2 flex items-center"
          >
            <Plus className="w-4 h-4" />
            Add Billing Code
          </Button>
        </div>

        <BillingCodesTable />

        <BillingCodeDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
