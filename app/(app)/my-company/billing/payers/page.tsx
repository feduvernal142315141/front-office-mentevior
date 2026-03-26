"use client"

import { Building2, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/custom/Button"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePayersPermissionFallback } from "./hooks/usePayersPermissionFallback"
import { NewPayerModal } from "./components/phase-2/NewPayerModal"
import { PayersTable, type PayersTableRef } from "./components/PayersTable"

export default function PayersPage() {
  const router = useRouter()
  const { hydrated } = useAuth()
  const { canViewPayers, canCreatePayers } = usePayersPermissionFallback()
  const [showNewModal, setShowNewModal] = useState(false)
  const tableRef = useRef<PayersTableRef>(null)

  useEffect(() => {
    if (hydrated && !canViewPayers) {
      router.replace("/dashboard")
    }
  }, [canViewPayers, hydrated, router])

  if (!hydrated || !canViewPayers) {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Building2 className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Payers
              </h1>
              <p className="text-slate-600 mt-1">Manage insurance payers for your organization</p>
            </div>
          </div>

          {canCreatePayers && (
            <Button
              variant="primary"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add payer
            </Button>
          )}
        </div>

        <PayersTable ref={tableRef} />

        <NewPayerModal
          open={showNewModal}
          onOpenChange={setShowNewModal}
          onSuccess={() => tableRef.current?.refetch()}
        />
      </div>
    </div>
  )
}
