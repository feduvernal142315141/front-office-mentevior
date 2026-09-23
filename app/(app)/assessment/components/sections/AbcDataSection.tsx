"use client"

import { useMemo } from "react"
import { ListTree, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { usePlacesOfService } from "@/lib/modules/addresses/hooks/use-places-of-service"
import type { AssessmentAbcInput } from "@/lib/types/assessment.types"

interface AbcDataSectionProps {
  rows: AssessmentAbcInput[]
  hasError?: boolean
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentAbcInput, value: string | string[]) => void
}

export function AbcDataSection({ rows, hasError, disabled, onAdd, onRemove, onUpdate }: AbcDataSectionProps) {
  const { placesOfService } = usePlacesOfService()
  const posOptions = useMemo(
    () => placesOfService.map((p) => ({ value: p.id, label: p.code ? `${p.name} (${p.code})` : p.name })),
    [placesOfService],
  )

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
          <ListTree className={`h-6 w-6 ${hasError ? "text-red-300" : "text-slate-300"}`} />
          <p className={`text-sm ${hasError ? "text-red-500" : "text-slate-500"}`}>No ABC data added</p>
        </div>
      )}

      {rows.map((row, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr_auto]">
            <PremiumDatePicker
              label="Date"
              value={row.date}
              onChange={(v) => onUpdate(index, "date", v)}
              onClear={() => onUpdate(index, "date", "")}
              required
            />
            <MultiSelect
              label="POS"
              value={row.placesOfService}
              onChange={(v) => onUpdate(index, "placesOfService", v)}
              options={posOptions}
              disabled={disabled}
              searchable
              tone="neutral"
              placeholder="Select POS"
              maxVisibleTags={2}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border border-red-200/60 bg-gradient-to-b from-red-50 to-red-100/80 text-red-600 transition-all hover:from-red-100 hover:to-red-200/90 disabled:opacity-50"
              title="Remove ABC row"
              aria-label="Remove ABC row"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FloatingInput
              label="Antecedent"
              value={row.antecedent}
              onChange={(v) => onUpdate(index, "antecedent", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
            <FloatingInput
              label="Behavior"
              value={row.behavior}
              onChange={(v) => onUpdate(index, "behavior", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
            <FloatingInput
              label="Consequence"
              value={row.consequence}
              onChange={(v) => onUpdate(index, "consequence", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled} className="gap-2 flex items-center">
        <Plus className="h-4 w-4" />
        Add ABC row
      </Button>
    </div>
  )
}
