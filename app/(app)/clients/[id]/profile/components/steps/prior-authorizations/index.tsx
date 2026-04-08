"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Edit2, FileCheck, Calendar, Shield, Hash, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/custom/Button"
import { LinkedEventsModal } from "./LinkedEventsModal"
import { PriorAuthCreateView } from "./PriorAuthCreateView"
import { PriorAuthEditView } from "./PriorAuthEditView"
import { usePriorAuthorizationsByClient } from "@/lib/modules/prior-authorizations/hooks/use-prior-authorizations-by-client"
import { useCancelPriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-cancel-prior-authorization"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { useClientInsurancesByClient } from "@/lib/modules/client-insurances/hooks/use-client-insurances-by-client"
import { getPriorAuthorizationById } from "@/lib/modules/prior-authorizations/services/prior-authorizations-api.service"
import {
  calculatePAStatus,
  getPAStatusBadgeClasses,
} from "@/lib/utils/prior-auth-utils"
import type {
  PriorAuthorization,
  PriorAuthBillingCode,
} from "@/lib/types/prior-authorization.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { cn } from "@/lib/utils"

type StepView =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; pa: PriorAuthorization }

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  try {
    return format(parseISO(dateStr), "MM/dd/yyyy")
  } catch {
    return dateStr
  }
}

export function StepPriorAuthorizations({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onProgressUpdate,
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const [currentView, setCurrentView] = useState<StepView>({ mode: "list" })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [billingCodesMap, setBillingCodesMap] = useState<Record<string, PriorAuthBillingCode[]>>({})
  const [loadingBCIds, setLoadingBCIds] = useState<Set<string>>(new Set())
  const [linkedEventsPA, setLinkedEventsPA] = useState<PriorAuthorization | null>(null)
  const [linkedEventsCode, setLinkedEventsCode] = useState<PriorAuthBillingCode | null>(null)
  const [isLinkedEventsOpen, setIsLinkedEventsOpen] = useState(false)
  const [deletingPA, setDeletingPA] = useState<PriorAuthorization | null>(null)

  const { cancel, isLoading: isDeleting } = useCancelPriorAuthorization()

  // Resolve clientId — same pattern as StepInsurances
  const resolvedClientId = useMemo(() => {
    if (!isCreateMode && clientId !== "new") return clientId

    if (typeof window === "undefined") return null

    const segments = window.location.pathname.split("/")
    const clientsIndex = segments.findIndex((s) => s === "clients")
    const possibleId = clientsIndex >= 0 ? segments[clientsIndex + 1] : null

    if (!possibleId || possibleId === "new") return null
    return possibleId
  }, [clientId, isCreateMode])

  const { pas, isLoading, error, refetch } = usePriorAuthorizationsByClient(resolvedClientId)
  const { insurances } = useClientInsurancesByClient(resolvedClientId)

  // Wizard integration
  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ priorAuthsCount: pas.length })
    })
  }, [pas.length, onSaveSuccess, registerSubmit])

  useEffect(() => {
    onStepStatusChange?.("priorAuth", pas.length > 0 ? "COMPLETE" : "PENDING")
  }, [pas.length, onStepStatusChange])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        setLoadingBCIds((s) => new Set(s).add(id))
        void getPriorAuthorizationById(id)
          .then((pa) => {
            setBillingCodesMap((m) => ({ ...m, [id]: pa.billingCodes }))
          })
          .finally(() => {
            setLoadingBCIds((s) => {
              const n = new Set(s)
              n.delete(id)
              return n
            })
          })
      }
      return next
    })
  }

  const refreshExpandedBillingCodes = async () => {
    const expandedPaIds = Array.from(expandedIds)
    if (expandedPaIds.length === 0) return

    setLoadingBCIds((prev) => {
      const next = new Set(prev)
      expandedPaIds.forEach((id) => next.add(id))
      return next
    })

    const refreshed = await Promise.all(
      expandedPaIds.map(async (id) => {
        try {
          const pa = await getPriorAuthorizationById(id)
          return { id, billingCodes: pa.billingCodes }
        } catch {
          return null
        }
      })
    )

    setBillingCodesMap((prev) => {
      const next = { ...prev }
      refreshed.forEach((item) => {
        if (!item) return
        next[item.id] = item.billingCodes
      })
      return next
    })

    setLoadingBCIds((prev) => {
      const next = new Set(prev)
      expandedPaIds.forEach((id) => next.delete(id))
      return next
    })
  }

  // Enrich PAs with computed status and denormalized insurance name
  const enrichedPAs = useMemo(() => {
    return pas.map((pa) => ({
      ...pa,
      status: calculatePAStatus(pa.startDate, pa.endDate),
      insuranceName:
        pa.insuranceName ||
        insurances.find((ins) => ins.id === pa.insuranceId)?.payerName ||
        pa.insuranceName,
      memberInsuranceId:
        pa.memberInsuranceId ||
        insurances.find((ins) => ins.id === pa.insuranceId)?.memberNumber ||
        "",
    }))
  }, [pas, insurances])

  if (!resolvedClientId) {
    return (
      <div className="w-full p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing prior authorizations.
          </p>
        </div>
      </div>
    )
  }

  // ── View switching ──────────────────────────────────────────────
  if (currentView.mode === "create") {
    return (
      <div className="w-full px-6 py-8 sm:px-8">
        <PriorAuthCreateView
          clientId={resolvedClientId}
          insurances={insurances}
          onBack={() => setCurrentView({ mode: "list" })}
          onSaved={async () => {
            await refetch()
            await refreshExpandedBillingCodes()
          }}
          onProgressUpdate={onProgressUpdate}
        />
      </div>
    )
  }

  if (currentView.mode === "edit") {
    return (
      <div className="w-full px-6 py-8 sm:px-8">
        <PriorAuthEditView
          clientId={resolvedClientId}
          editingPA={currentView.pa}
          insurances={insurances}
          onBack={() => setCurrentView({ mode: "list" })}
          onSaved={async () => {
            await refetch()
            await refreshExpandedBillingCodes()
          }}
          onProgressUpdate={onProgressUpdate}
        />
      </div>
    )
  }

  // ── List view (default) ─────────────────────────────────────────
  return (
    <div className="w-full px-6 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Prior Authorizations</h2>
          <p className="text-slate-600 mt-1">
            Insurance authorizations required to provide and bill services
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setCurrentView({ mode: "create" })}
        >
          New prior authorization
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && enrichedPAs.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <FileCheck className="h-10 w-10 text-[#037ECC]/60" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">No prior authorizations yet</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Add a prior authorization to enable service delivery and billing for this client.
            </p>
          </div>
        </div>
      )}

      {/* PA Cards */}
      {!isLoading && enrichedPAs.length > 0 && (
        <div className="space-y-3">
          {/* Column labels */}
          <div className="hidden xl:grid grid-cols-[32px_100px_minmax(100px,1fr)_200px_80px_72px] items-center gap-2 px-5 pb-1">
            <div />
            <span className="text-xs font-semibold text-[#037ECC]/60 uppercase tracking-wider">PA Number</span>
            <span className="text-xs font-semibold text-[#037ECC]/60 uppercase tracking-wider">Insurance</span>
            <span className="text-xs font-semibold text-[#037ECC]/60 uppercase tracking-wider text-center">Period</span>
            <span className="text-xs font-semibold text-[#037ECC]/60 uppercase tracking-wider text-center">Status</span>
            <span className="text-xs font-semibold text-[#037ECC]/60 uppercase tracking-wider text-center">Actions</span>
          </div>

          {enrichedPAs.map((pa) => {
            const isExpanded = expandedIds.has(pa.id)
            const codes = billingCodesMap[pa.id] ?? []

            return (
              <div
                key={pa.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-5 xl:grid xl:grid-cols-[32px_100px_minmax(100px,1fr)_200px_80px_72px] xl:gap-2">
                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(pa.id)}
                    className={cn(
                      "h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl",
                      "bg-slate-100 hover:bg-slate-200 transition-colors duration-150"
                    )}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-500 transition-transform duration-200",
                        isExpanded ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>

                  {/* PA Number */}
                  <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                    <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-800 tabular-nums">
                      {pa.authNumber}
                    </span>
                  </div>

                  {/* Insurance */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600 truncate" title={pa.insuranceName}>
                      {pa.insuranceName || "—"}
                    </span>
                  </div>

                  {/* Date range */}
                  <div className="hidden xl:flex items-center justify-center gap-1.5 text-sm text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="whitespace-nowrap">{formatDate(pa.startDate)}</span>
                    <span className="text-slate-300">→</span>
                    <span className="whitespace-nowrap">{formatDate(pa.endDate)}</span>
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase whitespace-nowrap",
                      "xl:justify-self-center",
                      getPAStatusBadgeClasses(pa.status)
                    )}
                  >
                    {pa.status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 ml-auto xl:ml-0 xl:w-[72px]">
                    <button
                      type="button"
                      onClick={() => setDeletingPA(pa)}
                      className={cn(
                        "group/del h-8 w-8",
                        "flex items-center justify-center rounded-xl",
                        "bg-gradient-to-b from-red-50 to-red-100/80",
                        "border border-red-200/60 shadow-sm",
                        "hover:from-red-100 hover:to-red-200/90 hover:border-red-300/80",
                        "hover:-translate-y-0.5 active:translate-y-0",
                        "transition-all duration-200 ease-out",
                        "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
                      )}
                      title="Delete prior authorization"
                      aria-label="Delete prior authorization"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover/del:text-red-700 transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentView({ mode: "edit", pa })}
                      className={cn(
                        "group/edit h-8 w-8",
                        "flex items-center justify-center rounded-xl",
                        "bg-gradient-to-b from-blue-50 to-blue-100/80",
                        "border border-blue-200/60 shadow-sm",
                        "hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300/80",
                        "hover:-translate-y-0.5 active:translate-y-0",
                        "transition-all duration-200 ease-out",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                      )}
                      title="Edit prior authorization"
                      aria-label="Edit prior authorization"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600 group-hover/edit:text-blue-700 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Expanded — billing codes */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 pb-4 pt-3">
                    {loadingBCIds.has(pa.id) ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                        ))}
                      </div>
                    ) : codes.length === 0 ? (
                      <p className="py-3 text-center text-sm text-slate-400 italic">
                        No billing codes assigned.
                      </p>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        {/* Sub-header */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 py-2 bg-slate-100/80 border-b border-slate-200">
                          {["Billing Code", "Approved", "Used", "Remaining"].map((h) => (
                            <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                              {h}
                            </span>
                          ))}
                        </div>

                        {codes.map((bc, bcIdx) => {
                          const isLow = bc.remainingUnits === 0
                          const isWarning = !isLow && bc.remainingUnits < bc.approvedUnits * 0.1

                          return (
                            <div
                              key={bc.id}
                              className={cn(
                                "grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center",
                                bcIdx < codes.length - 1 && "border-b border-slate-100"
                              )}
                            >
                              <span className="block text-sm font-semibold text-[#037ECC] truncate min-w-0" title={bc.billingCodeLabel}>
                                {bc.billingCodeLabel}
                              </span>

                              <span className="text-sm tabular-nums text-slate-600">
                                {bc.approvedUnits.toLocaleString()}
                              </span>
                              <span className="text-sm tabular-nums text-slate-600">
                                {bc.usedUnits.toLocaleString()}
                              </span>
                              <span className={cn(
                                "text-sm tabular-nums font-bold",
                                isLow ? "text-red-500" : isWarning ? "text-amber-600" : "text-emerald-600"
                              )}>
                                {bc.remainingUnits.toLocaleString()}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Linked Events Modal */}
      <LinkedEventsModal
        open={isLinkedEventsOpen}
        onClose={() => {
          setIsLinkedEventsOpen(false)
          setLinkedEventsPA(null)
          setLinkedEventsCode(null)
        }}
        billingCode={linkedEventsCode}
        paNumber={linkedEventsPA?.authNumber ?? ""}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingPA}
        onClose={() => setDeletingPA(null)}
        onConfirm={async () => {
          if (!deletingPA) return
          const progress = await cancel(deletingPA.id)
          if (progress !== null) {
            onProgressUpdate?.(progress)
            setBillingCodesMap((m) => { const n = { ...m }; delete n[deletingPA.id]; return n })
            setExpandedIds((prev) => { const n = new Set(prev); n.delete(deletingPA.id); return n })
            setDeletingPA(null)
            await refetch()
          }
        }}
        title="Delete Prior Authorization"
        message="Are you sure you want to delete this prior authorization? This action cannot be undone."
        itemName={deletingPA ? `PA #${deletingPA.authNumber} — ${deletingPA.insuranceName}` : undefined}
        isDeleting={isDeleting}
      />
    </div>
  )
}
