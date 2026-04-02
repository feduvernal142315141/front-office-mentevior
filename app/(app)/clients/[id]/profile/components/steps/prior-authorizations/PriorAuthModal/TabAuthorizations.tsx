"use client"

import { useState } from "react"
import { Edit2, Plus, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { BillingCodeModal } from "../BillingCodeModal"
import { useAuthorizationBillingCodes } from "@/lib/modules/authorization-billing-codes/hooks/use-authorization-billing-codes"
import { useCreateAuthorizationBillingCode } from "@/lib/modules/authorization-billing-codes/hooks/use-create-authorization-billing-code"
import { useUpdateAuthorizationBillingCode } from "@/lib/modules/authorization-billing-codes/hooks/use-update-authorization-billing-code"
import { useDeleteAuthorizationBillingCode } from "@/lib/modules/authorization-billing-codes/hooks/use-delete-authorization-billing-code"
import type { PriorAuthBillingCode } from "@/lib/types/prior-authorization.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import type { BillingCodeEntryValues } from "@/lib/schemas/prior-authorization-form.schema"
import { cn } from "@/lib/utils"

interface TabAuthorizationsProps {
  availableBillingCodes: BillingCodeListItem[]
  paId?: string
  onViewLinkedEvents?: (code: PriorAuthBillingCode) => void
}

export function TabAuthorizations({
  availableBillingCodes,
  paId,
  onViewLinkedEvents,
}: TabAuthorizationsProps) {
  const [isBCModalOpen, setIsBCModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PriorAuthBillingCode | null>(null)

  const { billingCodes, isLoading, refetch } = useAuthorizationBillingCodes(paId)
  const { create, isLoading: isCreating } = useCreateAuthorizationBillingCode()
  const { update, isLoading: isUpdating } = useUpdateAuthorizationBillingCode()
  const { remove, isLoading: isDeleting } = useDeleteAuthorizationBillingCode()

  const usedBillingCodeIds = billingCodes.map((bc) => bc.billingCodeId)
  const isBusy = isCreating || isUpdating || isDeleting

  const handleConfirm = async (values: BillingCodeEntryValues, label: string) => {
    if (!paId) return

    if (editingCode) {
      const result = await update({
        id: editingCode.id,
        priorAuthorizationId: paId,
        billingCodeId: values.billingCodeId,
        approvedUnits: values.approvedUnits,
        usedUnits: values.usedUnits,
        unitsInterval: values.unitsInterval,
        maxUnitsPerDay: values.maxUnitsPerDay ?? null,
        maxUnitsPerWeek: values.maxUnitsPerWeek ?? null,
        maxUnitsPerMonth: values.maxUnitsPerMonth ?? null,
        maxCountPerDay: values.maxCountPerDay ?? null,
        maxCountPerWeek: values.maxCountPerWeek ?? null,
        maxCountPerMonth: values.maxCountPerMonth ?? null,
      })
      if (!result) return
    } else {
      const result = await create({
        priorAuthorizationId: paId,
        billingCodeId: values.billingCodeId,
        approvedUnits: values.approvedUnits,
        usedUnits: values.usedUnits,
        unitsInterval: values.unitsInterval,
        maxUnitsPerDay: values.maxUnitsPerDay ?? null,
        maxUnitsPerWeek: values.maxUnitsPerWeek ?? null,
        maxUnitsPerMonth: values.maxUnitsPerMonth ?? null,
        maxCountPerDay: values.maxCountPerDay ?? null,
        maxCountPerWeek: values.maxCountPerWeek ?? null,
        maxCountPerMonth: values.maxCountPerMonth ?? null,
      })
      if (!result) return
    }

    await refetch()
    setEditingCode(null)
    setIsBCModalOpen(false)

    void label
  }

  const handleDelete = async (bc: PriorAuthBillingCode) => {
    const ok = await remove(bc.id)
    if (ok) await refetch()
  }

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : billingCodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium">No billing codes added</p>
          <p className="text-xs text-slate-400">
            Add the billing codes approved for this authorization
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Billing Code
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
              Approved
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
              Used
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
              Remaining
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
              Actions
            </span>
          </div>

          {billingCodes.map((bc, idx) => (
            <div
              key={bc.id}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center",
                idx < billingCodes.length - 1 && "border-b border-slate-100"
              )}
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-800 truncate block" title={bc.billingCodeLabel}>
                  {bc.billingCodeLabel}
                </span>
                <span className="text-xs text-slate-400 capitalize">{bc.unitsInterval}</span>
              </div>
              <span className="text-sm tabular-nums text-slate-700 text-right">
                {bc.approvedUnits.toLocaleString()}
              </span>
              <span className="text-sm tabular-nums text-slate-700 text-right">
                {bc.usedUnits.toLocaleString()}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums font-medium text-right",
                  bc.remainingUnits === 0
                    ? "text-red-500"
                    : bc.remainingUnits < bc.approvedUnits * 0.1
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                {bc.remainingUnits.toLocaleString()}
              </span>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCode(bc)
                    setIsBCModalOpen(true)
                  }}
                  disabled={isBusy}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg",
                    "bg-blue-50 border border-blue-200/60",
                    "hover:bg-blue-100 hover:border-blue-300",
                    "transition-colors duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title="Edit code"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(bc)}
                  disabled={isBusy}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg",
                    "bg-red-50 border border-red-200/60",
                    "hover:bg-red-100 hover:border-red-300",
                    "transition-colors duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title="Remove code"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
                {onViewLinkedEvents && (
                  <button
                    type="button"
                    onClick={() => onViewLinkedEvents(bc)}
                    disabled={isBusy}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-lg",
                      "bg-slate-50 border border-slate-200",
                      "hover:bg-slate-100 hover:border-slate-300",
                      "transition-colors duration-150",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="View linked events"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={() => {
              setEditingCode(null)
              setIsBCModalOpen(true)
            }}
            disabled={isBusy}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Billing Code
          </Button>
        </div>
      )}

      <BillingCodeModal
        open={isBCModalOpen}
        onClose={() => {
          setIsBCModalOpen(false)
          setEditingCode(null)
        }}
        onConfirm={handleConfirm}
        editingCode={editingCode}
        billingCodes={availableBillingCodes}
        usedBillingCodeIds={usedBillingCodeIds}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}
