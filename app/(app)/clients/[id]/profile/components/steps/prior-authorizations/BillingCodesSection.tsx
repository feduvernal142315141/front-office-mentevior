"use client"

import { Edit2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import type { LocalBillingCodeEntry } from "@/lib/types/prior-authorization.types"
import { cn } from "@/lib/utils"

interface BillingCodesSectionProps {
  entries: LocalBillingCodeEntry[]
  onAdd: () => void
  onEdit: (entry: LocalBillingCodeEntry) => void
  onDelete: (entry: LocalBillingCodeEntry) => void
  hasError?: boolean
}

export function BillingCodesSection({
  entries,
  onAdd,
  onEdit,
  onDelete,
  hasError = false,
}: BillingCodesSectionProps) {
  return (
    <div>
      {entries.length === 0 ? (
        <div className={cn(
          "flex flex-col items-center justify-center py-10 gap-3 text-slate-500 rounded-xl border-2",
          hasError ? "border-red-400/70 bg-red-50/40 mb-4" : "border-transparent"
        )}>
          <div className={cn(
            "h-14 w-14 rounded-2xl border flex items-center justify-center",
            hasError ? "bg-red-50 border-red-200" : "bg-slate-100 border-slate-200"
          )}>
            <Plus className={cn("w-6 h-6", hasError ? "text-red-400" : "text-slate-400")} />
          </div>
          <p className={cn("text-sm font-medium", hasError && "text-red-600")}>No billing codes added</p>
          <p className={cn("text-xs", hasError ? "text-red-400" : "text-slate-400")}>
            Add the billing codes approved for this authorization
          </p>
          
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Billing Code
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Approved
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Used
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Remaining
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
              Actions
            </span>
          </div>

          {entries.map((entry, idx) => (
            <div
              key={entry._tempId}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center",
                idx < entries.length - 1 && "border-b border-slate-100"
              )}
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-800 truncate block" title={entry.billingCodeLabel}>
                  {entry.billingCodeLabel}
                </span>
                <span className="text-xs text-slate-400 capitalize">{entry.unitsInterval}</span>
              </div>
              <span className="text-sm tabular-nums text-slate-700 text-center">
                {entry.approvedUnits.toLocaleString()}
              </span>
              <span className="text-sm tabular-nums text-slate-700 text-center">
                {entry.usedUnits.toLocaleString()}
              </span>
              <span className="text-sm tabular-nums text-slate-700 text-center">
                {entry.remainingUnits.toLocaleString()}
              </span>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
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
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg",
                    "bg-red-50 border border-red-200/60",
                    "hover:bg-red-100 hover:border-red-300",
                    "transition-colors duration-150"
                  )}
                  title="Remove code"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Billing Code
        </Button>
      </div>
    </div>
  )
}
