"use client"

import { useState } from "react"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import type { LocalInsurancePlanRate } from "@/lib/types/payer.types"
import { cn } from "@/lib/utils"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"

interface RatesSectionProps {
  entries: LocalInsurancePlanRate[]
  onAdd: () => void
  onEdit: (entry: LocalInsurancePlanRate) => void
  onDelete: (entry: LocalInsurancePlanRate) => void
  isDeleting?: boolean
}

export function RatesSection({
  entries,
  onAdd,
  onEdit,
  onDelete,
  isDeleting = false,
}: RatesSectionProps) {
  const [pendingDelete, setPendingDelete] = useState<LocalInsurancePlanRate | null>(null)
  return (
    <div>
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium">No rates added</p>
          <p className="text-xs text-slate-400">
            Add the rates for this insurance plan
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_90px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Billing Code
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Amount
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Currency
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Interval
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Actions
            </span>
          </div>

          {entries.map((entry, idx) => {
            const billingCodeDisplay = formatBillingCodeDisplay({
              code: entry.billingCodeLabel,
              modifier: entry.billingModifier,
            })

            return (
            <div
              key={entry._tempId}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_90px] gap-4 px-4 py-3 items-center",
                idx < entries.length - 1 && "border-b border-slate-100"
              )}
            >
              <div className="min-w-0">
                <span
                  className="text-sm font-medium text-slate-800 truncate block"
                  title={billingCodeDisplay}
                >
                  {billingCodeDisplay}
                </span>
                {entry.alias && (
                  <span className="text-xs text-slate-400">{entry.alias}</span>
                )}
              </div>
              <span className="text-sm tabular-nums text-slate-700 text-center">
                {new Intl.NumberFormat(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(entry.amount)}
              </span>
              <span className="text-sm text-slate-700 text-center truncate" title={entry.currencyLabel}>
                {entry.currencyLabel}
              </span>
              <span className="text-sm text-slate-700 text-center capitalize">
                {entry.intervalType.toLowerCase()}
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg",
                    "bg-blue-50 border border-blue-200/60",
                    "hover:bg-blue-100 hover:border-blue-300",
                    "transition-colors duration-150"
                  )}
                  title="Edit rate"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(entry)}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg",
                    "bg-red-50 border border-red-200/60",
                    "hover:bg-red-100 hover:border-red-300",
                    "transition-colors duration-150"
                  )}
                  title="Remove rate"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-center">
        <Button type="button" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Rate
        </Button>
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete)
          setPendingDelete(null)
        }}
        title="Delete Rate"
        message="Are you sure you want to delete this rate? This action cannot be undone."
        itemName={pendingDelete ? formatBillingCodeDisplay({ code: pendingDelete.billingCodeLabel, modifier: pendingDelete.billingModifier }) : undefined}
        isDeleting={isDeleting}
      />
    </div>
  )
}
