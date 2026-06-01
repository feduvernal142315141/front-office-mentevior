"use client"

import { useCallback, useState } from "react"
import { ClipboardList } from "lucide-react"

import { SelectServicePlanModal } from "../../../components/SelectServicePlanModal"

import { ServicePlanConfigView } from "./ServicePlanConfigView"

interface ServicePlanContentProps {
  clientId: string
  clientServicePlanId: string | null
}

export function ServicePlanContent({ clientId, clientServicePlanId }: ServicePlanContentProps) {
  const [spId, setSpId] = useState<string | null>(clientServicePlanId)
  const [showModal, setShowModal] = useState(false)

  const handleCloneSuccess = useCallback((newSpId: string) => {
    setSpId(newSpId)
  }, [])

  if (!spId) {
    return (
      <>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-600">No service plan assigned</p>
          <p className="text-sm text-slate-500 mt-1">
            Select a service plan to configure for this client.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#037ECC] to-[#079CFB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            Select Service Plan
          </button>
        </div>

        <SelectServicePlanModal
          open={showModal}
          clientId={clientId}
          onClose={() => setShowModal(false)}
          onCloneSuccess={handleCloneSuccess}
        />
      </>
    )
  }

  return <ServicePlanConfigView spId={spId} />
}
