"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { BillingCodesTable } from "./components/BillingCodesTable"
import { BillingCodeDrawer } from "./components/BillingCodeDrawer"

export default function BillingCodesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleSuccess = () => {
    setIsDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing Codes</h1>
          <p className="text-gray-600 mt-1">
            Manage CPT and HCPCS codes for your organization
          </p>
        </div>

        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
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
  )
}
