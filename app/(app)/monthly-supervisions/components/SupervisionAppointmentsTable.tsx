"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarX2, ChevronDown, Clock } from "lucide-react"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import type { SupervisionAppointment } from "@/lib/types/monthly-supervision.types"
import {
  SUPERVISION_EVALUATIONS,
  SUPERVISION_MODES,
  SUPERVISION_STRUCTURES,
  toSelectOptions,
} from "@/lib/constants/monthly-supervision-options"
import { parseLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

interface SupervisionAppointmentsTableProps {
  appointments: SupervisionAppointment[]
  onChange: (appointmentId: string, field: "mode" | "structure" | "evaluation", value: string) => void
  disabled?: boolean
  /** Ids con algún campo sin completar, para marcarlos al intentar guardar */
  invalidIds?: string[]
}

function formatDate(value: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

/**
 * Las supervisiones del mes, una por fila.
 *
 * El `summary` es **de sólo lectura**: sale de `activeDirectionNarrative` de la
 * nota 97155 y se muestra, no se edita (decisión del 2026-08-05). Va colapsado
 * porque son párrafos largos —150 a 400 palabras— y expandidos convertirían la
 * tabla en un muro de texto donde no se ve lo que hay que completar.
 *
 * Lo editable por reporte es la terna Mode / Structure / Evaluation.
 */
export function SupervisionAppointmentsTable({
  appointments,
  onChange,
  disabled,
  invalidIds = [],
}: SupervisionAppointmentsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (appointments.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <CalendarX2 className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">No supervisions this month</p>
        <p className="mt-1 text-xs text-slate-500">
          There are no 97155 appointments with this supervisee for the selected month.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {appointments.map((appointment) => {
        const isExpanded = expandedId === appointment.appointmentId
        const isInvalid = invalidIds.includes(appointment.appointmentId)

        return (
          <li
            key={appointment.appointmentId}
            className={cn("py-4 first:pt-0 last:pb-0", isInvalid && "-mx-3 rounded-xl bg-red-50/40 px-3")}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-sm font-semibold text-slate-900">{formatDate(appointment.date)}</span>
              {appointment.duration && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  <span className="tabular-nums">{appointment.duration}</span>
                </span>
              )}
              {isInvalid && (
                <span className="text-xs font-medium text-red-500">Complete all three fields</span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FloatingSelect
                label="Mode"
                value={appointment.mode ?? ""}
                onChange={(value) => onChange(appointment.appointmentId, "mode", value)}
                options={toSelectOptions(SUPERVISION_MODES, appointment.mode)}
                disabled={disabled}
                hasError={isInvalid && !appointment.mode}
                required
              />
              <FloatingSelect
                label="Structure"
                value={appointment.structure ?? ""}
                onChange={(value) => onChange(appointment.appointmentId, "structure", value)}
                options={toSelectOptions(SUPERVISION_STRUCTURES, appointment.structure)}
                disabled={disabled}
                hasError={isInvalid && !appointment.structure}
                required
              />
              <FloatingSelect
                label="Evaluation"
                value={appointment.evaluation ?? ""}
                onChange={(value) => onChange(appointment.appointmentId, "evaluation", value)}
                options={toSelectOptions(SUPERVISION_EVALUATIONS, appointment.evaluation)}
                disabled={disabled}
                hasError={isInvalid && !appointment.evaluation}
                required
              />
            </div>

            {appointment.summary && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : appointment.appointmentId)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium",
                    "text-[#037ECC] transition-colors hover:bg-[#037ECC]/5",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/30",
                  )}
                  aria-expanded={isExpanded}
                >
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-180")}
                    aria-hidden
                  />
                  {isExpanded ? "Hide session summary" : "Show session summary"}
                </button>

                {isExpanded && (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      From the 97155 session note · read only
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {appointment.summary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
