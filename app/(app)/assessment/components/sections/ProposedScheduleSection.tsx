"use client"

import { useCallback } from "react"
import { CalendarClock, Copy, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { formatTimeTo12h, formatTimeTo24h } from "@/lib/utils/time-format"
import {
  SCHEDULE_DAY_KEYS,
  parseTimeRangeHours,
  type ScheduleHours,
} from "@/lib/modules/assessments/utils/assessment-json-fields"
import type { ScheduleRow } from "../../hooks/useAssessmentForm"

/** Parse "h:mm AM/PM-h:mm AM/PM" into { start24, end24 } in 24h format for the time picker */
function parseRange(range: string): { start: string; end: string } {
  if (!range || !range.includes("-")) return { start: "", end: "" }
  const [s, e] = range.split("-").map((v) => v.trim())
  return {
    start: formatTimeTo24h(s ?? "") ?? "",
    end: formatTimeTo24h(e ?? "") ?? "",
  }
}

/** Build "h:mm AM/PM-h:mm AM/PM" from 24h start/end */
function buildRange(start24: string, end24: string): string {
  const s = start24 ? formatTimeTo12h(start24) : ""
  const e = end24 ? formatTimeTo12h(end24) : ""
  if (!s && !e) return ""
  return `${s || ""}-${e || ""}`
}

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
          return sum + parseTimeRangeHours(row.hours[day])
        }, 0)
        const totalLabel = Number.isInteger(total) ? String(total) : total.toFixed(1)

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
                Total: <span className="ml-1 font-semibold tabular-nums text-slate-800">{totalLabel} h/week</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {SCHEDULE_DAY_KEYS.map((day) => {
                const { start, end } = parseRange(row.hours[day])
                return (
                  <div key={day} className="grid grid-cols-[60px_1fr_1fr] items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">{day.slice(0, 3)}</span>
                    <FloatingTimePicker
                      label="From"
                      value={start}
                      onChange={(v) => onUpdateHours(index, day, buildRange(v, end))}
                      allowManualInput
                      disabled={disabled}
                    />
                    <FloatingTimePicker
                      label="To"
                      value={end}
                      onChange={(v) => onUpdateHours(index, day, buildRange(start, v))}
                      allowManualInput
                      defaultPeriod="PM"
                      disabled={disabled}
                    />
                  </div>
                )
              })}
            </div>
            {row.hours.Monday.trim() && !disabled && (
              <button
                type="button"
                onClick={() => {
                  const mon = row.hours.Monday
                  for (const day of ["Tuesday", "Wednesday", "Thursday", "Friday"] as const) {
                    onUpdateHours(index, day, mon)
                  }
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[#037ECC] transition-colors hover:bg-[#037ECC]/10"
              >
                <Copy className="h-3 w-3" />
                Apply Mon–Fri
              </button>
            )}
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
