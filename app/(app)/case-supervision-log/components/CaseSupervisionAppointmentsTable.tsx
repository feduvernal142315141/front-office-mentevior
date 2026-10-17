"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { CalendarX2 } from "lucide-react"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import type { CaseSupervisionAppointment } from "@/lib/types/case-supervision-log.types"
import { parseLocalDate } from "@/lib/date"
import { formatHours } from "./manual-entry-format"
import { ServiceTypeBadge } from "./ManualLogEntriesTable"
import { TagList } from "./TagList"

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

/**
 * Las sesiones del período, una por fila. **Siempre de sólo lectura**: las
 * calcula el backend, ni al preparar ni al consultar hay nada que editar.
 * Modality viene sólo como nombre (`modalityName`, contrato 2026-10-14).
 */
export function CaseSupervisionAppointmentsTable({
  appointments,
  emptyDescription = "There are no appointments for this client in the selected month.",
}: CaseSupervisionAppointmentsTableProps) {
  const columns = useMemo<CustomTableColumn<CaseSupervisionAppointment>[]>(
    () => [
      {
        key: "date",
        header: "Date",
        className: "whitespace-nowrap",
        render: (row) => <span className="font-medium text-slate-900">{formatDate(row.date)}</span>,
      },
      {
        key: "time",
        header: "Time",
        className: "whitespace-nowrap",
        render: (row) => (
          <span className="tabular-nums">
            {formatTime(row.timeStart)} – {formatTime(row.timeEnd)}
          </span>
        ),
      },
      {
        key: "hours",
        header: "Hours",
        align: "right",
        className: "whitespace-nowrap",
        render: (row) => <span className="font-semibold tabular-nums text-slate-900">{formatHours(row.duration)}</span>,
      },
      {
        key: "billingCode",
        header: "Billing Code",
        className: "whitespace-nowrap",
        render: (row) => row.billingCode || <span className="text-slate-400">—</span>,
      },
      {
        key: "serviceType",
        header: "Service Type",
        className: "whitespace-nowrap",
        render: (row) => <ServiceTypeBadge value={row.serviceType} />,
      },
      {
        key: "modality",
        header: "Modality",
        className: "whitespace-nowrap",
        render: (row) => row.modalityName || <span className="text-slate-400">—</span>,
      },
      {
        key: "location",
        header: "Location",
        className: "whitespace-nowrap",
        render: (row) => row.location || <span className="text-slate-400">—</span>,
      },
      {
        key: "participants",
        header: "Participants",
        className: "whitespace-nowrap",
        // El cliente participa siempre y no se persiste como participante (igual
        // que en la session note, donde va fijo): se antepone acá.
        render: (row) => (
          <TagList items={["Client", ...row.participants.filter((p) => p.toLowerCase() !== "client")]} />
        ),
      },
      {
        key: "characteristic",
        header: "Characteristic",
        className: "whitespace-nowrap",
        // `characteristic` trae saltos de línea reales: sin `whitespace-pre-line`
        // el código y "RBT Supervision" quedan pegados en un solo renglón.
        render: (row) => (
          <p className="min-w-[240px] max-w-[360px] whitespace-pre-line leading-snug text-slate-600">
            {row.characteristic || "—"}
          </p>
        ),
      },
    ],
    [],
  )

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
    <CustomTable
      columns={columns}
      data={appointments}
      getRowKey={(row, index) => row.id ?? `${row.date}-${row.timeStart}-${index}`}
    />
  )
}
