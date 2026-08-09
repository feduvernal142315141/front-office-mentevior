"use client"

import { format } from "date-fns"
import { CalendarX2 } from "lucide-react"
import type { CaseSupervisionAppointment } from "@/lib/types/case-supervision-log.types"
import { parseLocalDate } from "@/lib/date"

interface CaseSupervisionAppointmentsTableProps {
  appointments: CaseSupervisionAppointment[]
  /** Texto del estado vacío; cambia entre preparar y ver un reporte guardado */
  emptyDescription?: string
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
 * `"09:00:00"` → `"9:00 AM"`. Se formatea con aritmética sobre el string y no
 * con `new Date()` para no arrastrar la zona horaria del navegador a una hora
 * que el backend ya mandó resuelta.
 */
function formatTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? "")
  if (!match) return value || "—"

  const hours24 = Number(match[1])
  const suffix = hours24 >= 12 ? "PM" : "AM"
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12

  return `${hours12}:${match[2]} ${suffix}`
}

function formatDuration(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Las sesiones del período, una por fila. **Siempre de sólo lectura**: en este
 * reporte el usuario no aporta ningún dato de contenido —el backend calcula
 * todo— así que no hay nada editable, ni al preparar ni al consultar.
 *
 * No se usa `CustomTable` porque no hay paginación, orden ni click de fila: es
 * una tabla de lectura dentro de una pantalla, no un listado.
 *
 * La columna `Case Supervision Modality` del PDF no aparece acá: hoy el campo no
 * existe en el modelo (§8 de `docs/case-supervision-log-backend.md`) y una
 * columna permanentemente en blanco se lee como "falta cargar esto".
 */
export function CaseSupervisionAppointmentsTable({
  appointments,
  emptyDescription = "There are no appointments for this client in the selected month.",
}: CaseSupervisionAppointmentsTableProps) {
  if (appointments.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <CalendarX2 className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">No sessions this month</p>
        <p className="mt-1 text-xs text-slate-500">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>Date</Th>
            <Th>Time</Th>
            <Th align="right">Hours</Th>
            <Th>Characteristic</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {appointments.map((appointment, index) => (
            <tr
              key={appointment.id ?? `${appointment.date}-${appointment.timeStart}-${index}`}
              className="transition-colors hover:bg-slate-50/70"
            >
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900">
                {formatDate(appointment.date)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-slate-600">
                {formatTime(appointment.timeStart)} – {formatTime(appointment.timeEnd)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">
                {formatDuration(appointment.duration)}
              </td>
              {/* `characteristic` trae saltos de línea reales: sin
                  `whitespace-pre-line` el código y "RBT Supervision" quedan
                  pegados en un solo renglón. */}
              <td className="px-3 py-3 text-sm leading-snug text-slate-600 whitespace-pre-line">
                {appointment.characteristic || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  )
}
