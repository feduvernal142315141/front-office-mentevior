"use client"

import { useCallback, useMemo } from "react"
import { Eye, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { usePlacesOfService } from "@/lib/modules/addresses/hooks/use-places-of-service"
import type { AssessmentObservationInput, AssessmentObservationAbcEntry } from "@/lib/types/assessment.types"

interface ObservationsSectionProps {
  observations: AssessmentObservationInput[]
  errors: Record<string, string>
  hasError?: boolean
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentObservationInput, value: string | string[] | AssessmentObservationAbcEntry[]) => void
}

const EMPTY_ABC_ROW: AssessmentObservationAbcEntry = { antecedent: "", behavior: "", consequence: "" }

export function ObservationsSection({
  observations,
  errors,
  hasError,
  disabled,
  onAdd,
  onRemove,
  onUpdate,
}: ObservationsSectionProps) {
  const { placesOfService } = usePlacesOfService()
  const posOptions = useMemo(
    () => placesOfService.map((p) => ({ value: p.id, label: p.code ? `${p.name} (${p.code})` : p.name })),
    [placesOfService],
  )

  const addAbcRow = useCallback((obsIndex: number, current: AssessmentObservationAbcEntry[]) => {
    onUpdate(obsIndex, "abcEntries", [...current, { ...EMPTY_ABC_ROW }])
  }, [onUpdate])

  const removeAbcRow = useCallback((obsIndex: number, current: AssessmentObservationAbcEntry[], rowIndex: number) => {
    onUpdate(obsIndex, "abcEntries", current.filter((_, i) => i !== rowIndex))
  }, [onUpdate])

  const updateAbcField = useCallback((
    obsIndex: number,
    current: AssessmentObservationAbcEntry[],
    rowIndex: number,
    field: keyof AssessmentObservationAbcEntry,
    value: string,
  ) => {
    onUpdate(obsIndex, "abcEntries", current.map((row, i) => i === rowIndex ? { ...row, [field]: value } : row))
  }, [onUpdate])

  return (
    <div className="space-y-4">
      {observations.length === 0 && (
        <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
          <Eye className={`h-6 w-6 ${hasError ? "text-red-300" : "text-slate-300"}`} />
          <p className={`text-sm ${hasError ? "text-red-500" : "text-slate-500"}`}>No observations added</p>
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
            <MultiSelect
              label="POS"
              value={observation.placesOfService}
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
              title="Remove observation"
              aria-label="Remove observation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* ABC entries table */}
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">Antecedent</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">Behavior</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">Consequence</span>
              <span className="w-10" />
            </div>
            {observation.abcEntries.map((entry, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <FloatingInput
                  label="Antecedent"
                  value={entry.antecedent}
                  onChange={(v) => updateAbcField(index, observation.abcEntries, rowIdx, "antecedent", v)}
                  onBlur={() => {}}
                  disabled={disabled}
                />
                <FloatingInput
                  label="Behavior"
                  value={entry.behavior}
                  onChange={(v) => updateAbcField(index, observation.abcEntries, rowIdx, "behavior", v)}
                  onBlur={() => {}}
                  disabled={disabled}
                />
                <FloatingInput
                  label="Consequence"
                  value={entry.consequence}
                  onChange={(v) => updateAbcField(index, observation.abcEntries, rowIdx, "consequence", v)}
                  onBlur={() => {}}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => removeAbcRow(index, observation.abcEntries, rowIdx)}
                  disabled={disabled}
                  className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200/60 bg-red-50 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                  title="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addAbcRow(index, observation.abcEntries)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#037ECC] transition-colors hover:bg-[#037ECC]/10 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add ABC row
            </button>
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
