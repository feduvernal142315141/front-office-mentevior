"use client"

import { Building2 } from "lucide-react"
import { useState } from "react"
import { PayersToolbar } from "./components/phase-1/PayersToolbar"
import { PayersGrid } from "./components/phase-1/PayersGrid"
import { NewPayerModal } from "./components/phase-2/NewPayerModal"
import { EditPayerModal } from "./components/phase-3/EditPayerModal"
import { PlanConfigModal } from "./components/phase-3/PlanConfigModal"
import { usePayers } from "@/lib/modules/payers/hooks/use-payers"
import type { Payer } from "@/lib/types/payer.types"

export default function PayersPage() {
  const [search, setSearch] = useState("")
  const [showNewModal, setShowNewModal] = useState(false)
  const [payerToEdit, setPayerToEdit] = useState<Payer | null>(null)
  const [payerToConfigure, setPayerToConfigure] = useState<Payer | null>(null)
  const { payers, isLoading, error, refresh } = usePayers(search)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Building2 className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Payers
            </h1>
            <p className="text-slate-600 mt-1">Premium insurance management with mock-ready architecture</p>
          </div>
        </div>

        <PayersToolbar
          search={search}
          onSearchChange={setSearch}
          onNewPayer={() => setShowNewModal(true)}
        />

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <PayersGrid
          payers={payers}
          isLoading={isLoading}
          onEdit={(payer) => setPayerToEdit(payer)}
          onConfigurePlan={(payer) => setPayerToConfigure(payer)}
        />

        <NewPayerModal
          open={showNewModal}
          onOpenChange={setShowNewModal}
        />

        <EditPayerModal
          payer={payerToEdit}
          open={Boolean(payerToEdit)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setPayerToEdit(null)
            }
          }}
          onSaved={refresh}
        />

        <PlanConfigModal
          payer={payerToConfigure}
          open={Boolean(payerToConfigure)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setPayerToConfigure(null)
            }
          }}
          onSaved={refresh}
        />
      </div>
    </div>
  )
}
