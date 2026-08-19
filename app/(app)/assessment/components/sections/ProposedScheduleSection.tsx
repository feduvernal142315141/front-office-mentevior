"use client"

import { CalendarClock, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import {
  SCHEDULE_DAY_KEYS,
  type ScheduleHours,
} from "@/lib/modules/assessments/utils/assessment-json-fields"
import type { ScheduleRow } from "../../hooks/useAssessmentForm"

interface ProposedScheduleSectionProps {
  rows: ScheduleRow[]
  options: { value: string; label: string }[]
  optionsLoading: boolean
  errors: Record<string, string>
  /** Pinta el empty state en rojo cuando la sección exige al menos una fila */
  hasError?: boolean
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdateCredential: (index: number, credentialId: string) => void
  onUpdateHours: (index: number, day: keyof ScheduleHours, value: string) => void
}

/** Horario propuesto por credencial: horas por día de la semana (Monday…Sunday) */
export function ProposedScheduleSection({
  rows,
  options,
  optionsLoading,
  errors,
  hasError,
  disabled,
  onAdd,
  onRemove,
  onUpdateCredential,
  onUpdateHours,
}: ProposedScheduleSectionProps) {
  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
          <CalendarClock className={`h-6 w-6 ${hasError ? "text-red-300" : "text-slate-300"}`} />
          <p className={`text-sm ${hasError ? "text-red-500" : "text-slate-500"}`}>No proposed schedule added</p>
        </div>
      )}

      {rows.map((row, index) => {
        const rowError = errors[`schedule-${index}`]
        const total = SCHEDULE_DAY_KEYS.reduce((sum, day) => {
          const parsed = Number.parseFloat(row.hours[day])
          return sum + (Number.isFinite(parsed) && parsed > 0 ? parsed : 0)
        }, 0)

        return (
          <div
            key={index}
            data-field={`schedule-${index}`}
            className={`rounded-xl border p-4 ${rowError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/40"}`}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr_auto]">
              <FloatingSelect
                label="Credential"
                value={row.credentialId}
                onChange={(v) => onUpdateCredential(index, v)}
                options={options}
                disabled={disabled || optionsLoading}
                hasError={!!rowError && !row.credentialId}
                searchable
              />
              <div className="flex items-center justify-end text-sm text-slate-500 md:order-last">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200/60 bg-gradient-to-b from-red-50 to-red-100/80 text-red-600 transition-all hover:from-red-100 hover:to-red-200/90 disabled:opacity-50"
                  title="Remove schedule"
                  aria-label="Remove schedule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                Total: <span className="ml-1 font-semibold tabular-nums text-slate-800">{total} h/week</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {SCHEDULE_DAY_KEYS.map((day) => (
                <div key={day}>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{day.slice(0, 3)}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.hours[day]}
                    onChange={(e) => onUpdateHours(index, day, e.target.value)}
                    disabled={disabled}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm tabular-nums text-slate-800 placeholder:text-slate-300 focus:border-[#037ECC] focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 disabled:opacity-50"
                    aria-label={`Hours on ${day}`}
                  />
                </div>
              ))}
            </div>
            {rowError && <p className="mt-2 text-xs font-medium text-red-500">{rowError}</p>}
          </div>
        )
      })}

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled} className="gap-2 flex items-center">
        <Plus className="h-4 w-4" />
        Add schedule
      </Button>
    </div>
  )
}
