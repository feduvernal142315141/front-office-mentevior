"use client"

import { useCallback } from "react"
import { CalendarDays, Plus, Trash2 } from "lucide-react"
import { toast } from "@/lib/compat/sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import {
  deleteClientCategoryBaseline,
  deleteClientItemBaseline,
} from "@/lib/modules/client-service-plan/services/client-data-collection.service"

export interface BaselineRow {
  localId: string
  recordId?: string
  date: string
  value: string
  periodCatalogId: string
  comments: string
  show: boolean
}

export function createEmptyBaseline(): BaselineRow {
  return {
    localId: crypto.randomUUID(),
    date: "",
    value: "",
    periodCatalogId: "",
    comments: "",
    show: true,
  }
}

interface BaselinesTabContentProps {
  baselines: BaselineRow[]
  onChange: (baselines: BaselineRow[]) => void
  mode: "category" | "item"
  periodSelectOptions: { value: string; label: string }[]
  showErrors?: boolean
  hideAddButton?: boolean
}

export function BaselinesTabContent({
  baselines,
  onChange,
  mode,
  periodSelectOptions,
  showErrors = false,
  hideAddButton = false,
}: BaselinesTabContentProps) {

  const handleAdd = useCallback(() => {
    onChange([...baselines, createEmptyBaseline()])
  }, [baselines, onChange])

  const handleUpdate = useCallback(
    (localId: string, field: keyof BaselineRow, value: string | boolean) => {
      onChange(
        baselines.map((row) => {
          if (row.localId === localId) return { ...row, [field]: value }
          // Auto-fill period on other baselines that have it empty
          if (field === "periodCatalogId" && value && !row.periodCatalogId) {
            return { ...row, periodCatalogId: value as string }
          }
          return row
        })
      )
    },
    [baselines, onChange]
  )

  const handleDelete = useCallback(
    async (row: BaselineRow) => {
      if (row.recordId) {
        try {
          if (mode === "item") {
            await deleteClientItemBaseline(row.recordId)
          } else {
            await deleteClientCategoryBaseline(row.recordId)
          }
          toast.success("Baseline removed")
        } catch {
          toast.error("Failed to delete baseline")
          return
        }
      }
      onChange(baselines.filter((b) => b.localId !== row.localId))
    },
    [baselines, onChange, mode]
  )

  return (
    <div className="space-y-5 pb-2">
      {baselines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 text-center">
          <p className="text-sm text-slate-500">No baselines configured yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {baselines.map((row) => (
            <div
              key={row.localId}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-3 overflow-visible relative z-0 focus-within:z-50"
            >
              {/* Main fields row */}
              <div className="flex items-end gap-3">
                <div className="flex-1 min-w-0">
                  <PremiumDatePicker
                    label="Date"
                    value={row.date}
                    onChange={(v) => handleUpdate(row.localId, "date", v)}
                    hasError={showErrors && !row.date}
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <FloatingInput
                    label="Value"
                    value={row.value}
                    onChange={(v) => handleUpdate(row.localId, "value", v.replace(/[^0-9.-]/g, ""))}
                    onBlur={() => {}}
                    inputMode="numeric"
                    hasError={showErrors && !row.value}
                    required
                  />
                </div>
                <div className="flex-1 min-w-0 relative">
                  <FloatingSelect
                    label="Period"
                    value={row.periodCatalogId}
                    onChange={(v) => handleUpdate(row.localId, "periodCatalogId", v)}
                    options={periodSelectOptions}
                    dropdownPosition="bottom"
                    hasError={showErrors && !row.periodCatalogId}
                    required
                  />
                </div>
                {/* Environmental Changes — visible only on 2xl+ */}
                <div className="hidden 2xl:block flex-1 min-w-0">
                  <FloatingInput
                    label="Environmental Changes"
                    value={row.comments}
                    onChange={(v) => handleUpdate(row.localId, "comments", v)}
                    onBlur={() => {}}
                  />
                </div>
                {/* Show toggle hidden */}
                <button
                  type="button"
                  onClick={() => void handleDelete(row)}
                  className={cn(
                    "shrink-0 flex items-center justify-center h-9 w-9 rounded-lg mb-1",
                    "text-red-400 hover:text-red-600 hover:bg-red-50",
                    "transition-colors"
                  )}
                  title="Remove baseline"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {/* Environmental Changes — visible only below 2xl */}
              <div className="2xl:hidden">
                <FloatingInput
                  label="Environmental Changes"
                  value={row.comments}
                  onChange={(v) => handleUpdate(row.localId, "comments", v)}
                  onBlur={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button - centered */}
      {!hideAddButton && (
        <div className="flex justify-center pt-1">
          <Button type="button" onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add baseline
          </Button>
        </div>
      )}
    </div>
  )
}
