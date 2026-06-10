"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ClipboardList, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { SelectServicePlanModal } from "../../../components/SelectServicePlanModal"
import { ServicePlanConfigView } from "./ServicePlanConfigView"
import { useCompanyServicePlans } from "@/lib/modules/service-plans/hooks/use-company-service-plans"
import { cloneServicePlanToClient } from "@/lib/modules/client-service-plan/services/client-service-plan.service"

interface ServicePlanContentProps {
  clientId: string
  clientServicePlanId: string | null
  onServicePlanAssigned?: (spId: string) => void
}

export function ServicePlanContent({ clientId, clientServicePlanId, onServicePlanAssigned }: ServicePlanContentProps) {
  const [spId, setSpId] = useState<string | null>(clientServicePlanId)
  const [showModal, setShowModal] = useState(false)
  const [isAutoAssigning, setIsAutoAssigning] = useState(false)
  const autoAssignAttemptedRef = useRef(false)

  const { servicePlans, isLoading: isLoadingPlans } = useCompanyServicePlans()

  const handleCloneSuccess = useCallback((newSpId: string) => {
    setSpId(newSpId)
    onServicePlanAssigned?.(newSpId)
  }, [onServicePlanAssigned])

  // Auto-assign if company has exactly 1 service plan and client has none
  useEffect(() => {
    if (spId || isLoadingPlans || autoAssignAttemptedRef.current) return
    if (servicePlans.length !== 1) return

    autoAssignAttemptedRef.current = true
    const onlyPlan = servicePlans[0]

    setIsAutoAssigning(true)
    void cloneServicePlanToClient({ clientId, servicePlanId: onlyPlan.id })
      .then((newSpId) => {
        toast.success("Service plan assigned")
        setSpId(newSpId)
        onServicePlanAssigned?.(newSpId)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to assign service plan")
      })
      .finally(() => {
        setIsAutoAssigning(false)
      })
  }, [spId, isLoadingPlans, servicePlans, clientId])

  if (spId) {
    return <ServicePlanConfigView spId={spId} />
  }

  // Loading state while checking company plans or auto-assigning
  if (isLoadingPlans || isAutoAssigning) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#037ECC] mb-3" />
        <p className="text-sm text-slate-500">
          {isAutoAssigning ? "Assigning service plan..." : "Loading..."}
        </p>
      </div>
    )
  }

  // Multiple plans or no plans → show select button
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
