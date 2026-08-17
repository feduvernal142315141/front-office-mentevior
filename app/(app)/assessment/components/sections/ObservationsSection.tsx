"use client"

import { Eye, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import type { AssessmentObservationInput } from "@/lib/types/assessment.types"

interface ObservationsSectionProps {
  observations: AssessmentObservationInput[]
  errors: Record<string, string>
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentObservationInput, value: string) => void
}

export function ObservationsSection({
  observations,
  errors,
  disabled,
  onAdd,
  onRemove,
  onUpdate,
}: ObservationsSectionProps) {
  return (
    <div className="space-y-4">
      {observations.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8">
          <Eye className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No observations added</p>
        </div>
      )}

      {observations.map((observation, index) => (
        <div
          key={index}
          data-field={`observation-${index}`}
          className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr_auto]">
            <PremiumDatePicker
              label="Date"
              value={observation.date}
              onChange={(v) => onUpdate(index, "date", v)}
              onClear={() => onUpdate(index, "date", "")}
              hasError={!!errors[`observation-${index}`] && !observation.date}
              required
            />
            <FloatingInput
              label="Setting"
              value={observation.setting}
              onChange={(v) => onUpdate(index, "setting", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border border-red-200/60 bg-gradient-to-b from-red-50 to-red-100/80 text-red-600 transition-all hover:from-red-100 hover:to-red-200/90 disabled:opacity-50"
              title="Remove observation"
              aria-label="Remove observation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <FloatingTextarea
              label="Summary"
              value={observation.summary}
              onChange={(v) => onUpdate(index, "summary", v)}
              onBlur={() => {}}
              rows={3}
              disabled={disabled}
            />
          </div>
          {errors[`observation-${index}`] && (
            <p className="mt-2 text-xs font-medium text-red-500">{errors[`observation-${index}`]}</p>
          )}
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled} className="gap-2 flex items-center">
        <Plus className="h-4 w-4" />
        Add observation
      </Button>
    </div>
  )
}
