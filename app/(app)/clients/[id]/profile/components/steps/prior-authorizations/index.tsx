"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, FileCheck } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/custom/Button"
import { PriorAuthModal } from "./PriorAuthModal"
import { LinkedEventsModal } from "./LinkedEventsModal"
import { usePriorAuthorizationsByClient } from "@/lib/modules/prior-authorizations/hooks/use-prior-authorizations-by-client"
import { useClientInsurancesByClient } from "@/lib/modules/client-insurances/hooks/use-client-insurances-by-client"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import {
  calculatePAStatus,
  getPAStatusBadgeClasses,
  calculateEstimatedUsage,
  calculateRemainingUsage,
} from "@/lib/utils/prior-auth-utils"
import type {
  PriorAuthorization,
  PriorAuthBillingCode,
} from "@/lib/types/prior-authorization.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { cn } from "@/lib/utils"

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
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPA, setEditingPA] = useState<PriorAuthorization | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [linkedEventsPA, setLinkedEventsPA] = useState<PriorAuthorization | null>(null)
  const [linkedEventsCode, setLinkedEventsCode] = useState<PriorAuthBillingCode | null>(null)
  const [isLinkedEventsOpen, setIsLinkedEventsOpen] = useState(false)

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
  const { billingCodes: availableBillingCodes } = useBillingCodes({ pageSize: 300 })

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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleViewLinkedEvents = (pa: PriorAuthorization, code: PriorAuthBillingCode) => {
    setLinkedEventsPA(pa)
    setLinkedEventsCode(code)
    setIsLinkedEventsOpen(true)
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
          onClick={() => {
            setEditingPA(null)
            setIsModalOpen(true)
          }}
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

      {/* PA Table */}
      {!isLoading && enrichedPAs.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[36px_1fr_1fr_1fr_110px_110px_90px_80px] gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
            {["", "PA Number", "Insurance", "Recipient ID", "Start Date", "End Date", "Status", "Actions"].map(
              (h) => (
                <span
                  key={h}
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </span>
              )
            )}
          </div>

          {/* PA rows */}
          {enrichedPAs.map((pa, idx) => {
            const isExpanded = expandedIds.has(pa.id)

            return (
              <div
                key={pa.id}
                className={cn(
                  idx < enrichedPAs.length - 1 && "border-b border-slate-200"
                )}
              >
                {/* Main row */}
                <div className="grid grid-cols-[36px_1fr_1fr_1fr_110px_110px_90px_80px] gap-3 px-4 py-3.5 items-center hover:bg-slate-50/80 transition-colors">
                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(pa.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  <span className="text-sm font-semibold text-slate-800 tabular-nums">
                    {pa.authNumber}
                  </span>

                  <span
                    className="text-sm text-slate-700 truncate"
                    title={pa.insuranceName}
                  >
                    {pa.insuranceName || "—"}
                  </span>

                  <span className="text-sm tabular-nums text-slate-600">
                    {pa.memberInsuranceId || "—"}
                  </span>

                  <div>
                    <span className="text-sm text-slate-700">{formatDate(pa.startDate)}</span>
                  </div>

                  <div>
                    <span className="text-sm text-slate-700">{formatDate(pa.endDate)}</span>
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                      getPAStatusBadgeClasses(pa.status)
                    )}
                  >
                    {pa.status}
                  </span>

                  {/* Edit button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPA(pa)
                        setIsModalOpen(true)
                      }}
                      className={cn(
                        "h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium",
                        "bg-gradient-to-b from-blue-50 to-blue-100/80",
                        "border border-blue-200/60 text-blue-600",
                        "hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300",
                        "transition-all duration-150"
                      )}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Expanded billing codes */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-slate-50/60 border-t border-slate-100">
                    {pa.billingCodes.length === 0 ? (
                      <p className="py-4 text-sm text-slate-400 italic text-center">
                        No billing codes assigned to this authorization.
                      </p>
                    ) : (
                      <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden bg-white">
                        {/* Sub-table header */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr_2fr] gap-3 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                          {[
                            "Allowed Billing Codes",
                            "Max Units",
                            "Used Units",
                            "Remaining Units",
                            "Estimated Usage",
                            "Remaining Usage",
                          ].map((h) => (
                            <span
                              key={h}
                              className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                            >
                              {h}
                            </span>
                          ))}
                        </div>

                        {/* Sub-table rows */}
                        {pa.billingCodes.map((bc, bcIdx) => {
                          const estimated = calculateEstimatedUsage(
                            bc.approvedUnits,
                            pa.startDate,
                            pa.endDate
                          )
                          const remaining = calculateRemainingUsage(
                            bc.remainingUnits,
                            pa.endDate
                          )

                          return (
                            <div
                              key={bc.id}
                              className={cn(
                                "grid grid-cols-[2fr_1fr_1fr_1fr_2fr_2fr] gap-3 px-4 py-3 items-center",
                                bcIdx < pa.billingCodes.length - 1 &&
                                  "border-b border-slate-100"
                              )}
                            >
                              <span className="text-sm font-medium text-[#037ECC] truncate" title={bc.billingCodeLabel}>
                                {bc.billingCodeLabel.split(" — ")[0]}
                              </span>
                              <span className="text-sm tabular-nums text-slate-700">
                                {bc.approvedUnits.toLocaleString()}
                              </span>
                              <span className="text-sm tabular-nums text-slate-700">
                                {bc.usedUnits.toLocaleString()}
                              </span>
                              <span
                                className={cn(
                                  "text-sm tabular-nums font-semibold",
                                  bc.remainingUnits === 0
                                    ? "text-red-500"
                                    : bc.remainingUnits < bc.approvedUnits * 0.1
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                )}
                              >
                                {bc.remainingUnits.toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-500">{estimated}</span>
                              <span className="text-xs text-slate-500">{remaining}</span>
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

      {/* PA Modal */}
      <PriorAuthModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingPA(null)
        }}
        editingPA={editingPA}
        clientId={resolvedClientId}
        insurances={insurances}
        availableBillingCodes={availableBillingCodes}
        onSaved={async () => {
          setIsModalOpen(false)
          setEditingPA(null)
          await refetch()
        }}
        onViewLinkedEvents={handleViewLinkedEvents}
      />

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
    </div>
  )
}
