"use client"

import { useState } from "react"
import { Edit2, Plus, ExternalLink } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { BillingCodeModal } from "../BillingCodeModal"
import type { PriorAuthBillingCode } from "@/lib/types/prior-authorization.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import type { BillingCodeEntryValues } from "@/lib/schemas/prior-authorization-form.schema"
import { cn } from "@/lib/utils"

interface TabAuthorizationsProps {
  billingCodes: PriorAuthBillingCode[]
  onChange: (codes: PriorAuthBillingCode[]) => void
  /** Company billing codes for the dropdown */
  availableBillingCodes: BillingCodeListItem[]
  /** PA id — used to navigate to linked events (optional, only in edit mode) */
  paId?: string
  onViewLinkedEvents?: (code: PriorAuthBillingCode) => void
}

function makeLocalId(): string {
  return `bc-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function TabAuthorizations({
  billingCodes,
  onChange,
  availableBillingCodes,
  paId,
  onViewLinkedEvents,
}: TabAuthorizationsProps) {
  const [isBCModalOpen, setIsBCModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PriorAuthBillingCode | null>(null)

  const usedBillingCodeIds = billingCodes.map((bc) => bc.billingCodeId)

  const handleConfirm = (values: BillingCodeEntryValues, label: string) => {
    if (editingCode) {
      // Edit existing entry
      onChange(
        billingCodes.map((bc) =>
          bc.id === editingCode.id
            ? {
                ...bc,
                billingCodeId: values.billingCodeId,
                billingCodeLabel: label,
                approvedUnits: values.approvedUnits,
                usedUnits: values.usedUnits,
                remainingUnits: values.approvedUnits - values.usedUnits,
                unitsInterval: values.unitsInterval,
                maxUnitsPerDay: values.maxUnitsPerDay ?? null,
                maxUnitsPerWeek: values.maxUnitsPerWeek ?? null,
                maxUnitsPerMonth: values.maxUnitsPerMonth ?? null,
                maxCountPerDay: values.maxCountPerDay ?? null,
                maxCountPerWeek: values.maxCountPerWeek ?? null,
                maxCountPerMonth: values.maxCountPerMonth ?? null,
              }
            : bc
        )
      )
    } else {
      // Add new entry
      const newEntry: PriorAuthBillingCode = {
        id: makeLocalId(),
        billingCodeId: values.billingCodeId,
        billingCodeLabel: label,
        approvedUnits: values.approvedUnits,
        usedUnits: values.usedUnits,
        remainingUnits: values.approvedUnits - values.usedUnits,
        unitsInterval: values.unitsInterval,
        maxUnitsPerDay: values.maxUnitsPerDay ?? null,
        maxUnitsPerWeek: values.maxUnitsPerWeek ?? null,
        maxUnitsPerMonth: values.maxUnitsPerMonth ?? null,
        maxCountPerDay: values.maxCountPerDay ?? null,
        maxCountPerWeek: values.maxCountPerWeek ?? null,
        maxCountPerMonth: values.maxCountPerMonth ?? null,
      }
      onChange([...billingCodes, newEntry])
    }
    setEditingCode(null)
    setIsBCModalOpen(false)
  }

  return (
    <div>
      {billingCodes.length === 0 ? (
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
          {/* Table header */}
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

          {/* Rows */}
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
                {/* Edit code */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingCode(bc)
                    setIsBCModalOpen(true)
                  }}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg",
                    "bg-blue-50 border border-blue-200/60",
                    "hover:bg-blue-100 hover:border-blue-300",
                    "transition-colors duration-150"
                  )}
                  title="Edit code"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                </button>
                {/* View linked events — only in edit mode when paId exists */}
                {paId && onViewLinkedEvents && (
                  <button
                    type="button"
                    onClick={() => onViewLinkedEvents(bc)}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-lg",
                      "bg-slate-50 border border-slate-200",
                      "hover:bg-slate-100 hover:border-slate-300",
                      "transition-colors duration-150"
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

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={() => {
            setEditingCode(null)
            setIsBCModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Billing Code
        </Button>
      </div>

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
      />
    </div>
  )
}
