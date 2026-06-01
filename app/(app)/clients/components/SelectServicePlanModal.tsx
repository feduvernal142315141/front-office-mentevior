"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getCompanyServicePlans } from "@/lib/modules/service-plans/services/company-service-plans.service"
import { cloneServicePlanToClient } from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import type { CompanyServicePlan } from "@/lib/types/company-service-plan.types"

interface SelectServicePlanModalProps {
  open: boolean
  clientId: string | null
  onClose: () => void
  onCloneSuccess?: (spId: string) => void
}

export function SelectServicePlanModal({ open, clientId, onClose, onCloneSuccess }: SelectServicePlanModalProps) {
  const router = useRouter()

  const [servicePlans, setServicePlans] = useState<CompanyServicePlan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isCloning, setIsCloning] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedPlanId(null)
      setLoadError(null)
      return
    }

    let active = true

    void (async () => {
      setIsLoadingPlans(true)
      setLoadError(null)
      try {
        const { servicePlans: plans } = await getCompanyServicePlans()
        if (!active) return
        setServicePlans(plans)
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : "Failed to load service plans")
      } finally {
        if (active) setIsLoadingPlans(false)
      }
    })()

    return () => {
      active = false
    }
  }, [open])

  const handleAccept = async () => {
    if (!clientId || !selectedPlanId || isCloning) return

    setIsCloning(true)
    try {
      const newSpId = await cloneServicePlanToClient({ clientId, servicePlanId: selectedPlanId })
      toast.success("Service plan assigned")
      onClose()
      if (onCloneSuccess) {
        onCloneSuccess(newSpId)
      } else {
        router.push(`/clients/${clientId}/service-plan/${newSpId}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign service plan")
    } finally {
      setIsCloning(false)
    }
  }

  const handleClose = () => {
    if (isCloning) return
    onClose()
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => { if (!next) handleClose() }}
      title="Select Service Plan"
      description="Choose a company service plan to assign to this client."
      maxWidthClassName="sm:max-w-[560px]"
      onPointerDownOutside={(e) => { if (isCloning) e.preventDefault() }}
      onEscapeKeyDown={(e) => { if (isCloning) e.preventDefault() }}
    >
      <div className="px-6 py-5 space-y-4">
        {isLoadingPlans ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#037ECC]" />
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">Could not load service plans.</p>
            <p className="mt-1 text-sm text-red-600">{loadError}</p>
          </div>
        ) : servicePlans.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
            <p className="text-sm text-slate-500">No service plans available.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {servicePlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3.5 text-left transition-all duration-150",
                    isSelected
                      ? "border-[#037ECC]/40 bg-[#037ECC]/5 shadow-sm ring-2 ring-[#037ECC]/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        isSelected
                          ? "bg-[#037ECC]/10"
                          : "bg-slate-100"
                      )}
                    >
                      <FileText
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "text-[#037ECC]" : "text-slate-500"
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold truncate",
                          isSelected ? "text-[#037ECC]" : "text-slate-900"
                        )}
                      >
                        {plan.name}
                      </p>
                      {plan.serviceName && (
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{plan.serviceName}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          plan.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]"
                            : "border-slate-200 bg-slate-50 text-slate-500 text-[11px]"
                        }
                      >
                        {plan.active ? "Active" : "Inactive"}
                      </Badge>

                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 transition-colors",
                          isSelected
                            ? "border-[#037ECC] bg-[#037ECC]"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && (
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isCloning}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => { void handleAccept() }}
            disabled={!selectedPlanId || isCloning}
          >
            {isCloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Accept"
            )}
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
