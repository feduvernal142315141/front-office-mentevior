"use client"

import { format } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { parseLocalDate } from "@/lib/date"
import { formatTimeTo12h } from "@/lib/utils/time-format"
import type { SupervisionAppointment } from "@/lib/types/monthly-supervision.types"

interface ManualSupervisionsTableProps {
  appointments: SupervisionAppointment[]
  onEdit: (appointment: SupervisionAppointment) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

function formatDate(value: string) {
  if (!value) return "—"
  try { return format(parseLocalDate(value), "MMM d, yyyy") } catch { return value }
}

function formatTimeRange(start?: string, end?: string) {
  const from = start ? formatTimeTo12h(start.slice(0, 5)) : ""
  const to = end ? formatTimeTo12h(end.slice(0, 5)) : ""
  return from || to ? `${from || "—"} – ${to || "—"}` : "—"
}

function formatDuration(start?: string, end?: string) {
  if (!start || !end) return "—"
  const [startHour, startMinute] = start.slice(0, 5).split(":").map(Number)
  const [endHour, endMinute] = end.slice(0, 5).split(":").map(Number)
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
  return minutes > 0 ? `${(minutes / 60).toLocaleString("en-US", { maximumFractionDigits: 2 })} h` : "—"
}

export function ManualSupervisionsTable({ appointments, onEdit, onDelete, disabled }: ManualSupervisionsTableProps) {
  const columns: CustomTableColumn<SupervisionAppointment>[] = [
    { key: "date", header: "Date", className: "whitespace-nowrap", render: (row) => <span className="font-medium text-slate-900">{formatDate(row.date)}</span> },
    { key: "time", header: "Time", className: "whitespace-nowrap", render: (row) => <span className="tabular-nums">{formatTimeRange(row.timeStart, row.timeEnd)}</span> },
    { key: "duration", header: "Hours", className: "whitespace-nowrap", render: (row) => <span className="tabular-nums font-medium">{formatDuration(row.timeStart, row.timeEnd)}</span> },
    { key: "mode", header: "Mode", render: (row) => row.mode || "—" },
    { key: "structure", header: "Structure", render: (row) => row.structure || "—" },
    { key: "evaluation", header: "Evaluation", render: (row) => row.evaluation || "—" },
    { key: "observedWithClient", header: "Observed with client", render: (row) => row.observedWithClient === undefined ? "—" : row.observedWithClient ? "Yes" : "No" },
    { key: "note", header: "Note", className: "min-w-[220px]", render: (row) => <p className="line-clamp-2 whitespace-pre-line text-slate-600" title={row.supervisionNotes || undefined}>{row.supervisionNotes || "—"}</p> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      className: "whitespace-nowrap",
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" onClick={() => onEdit(row)} disabled={disabled} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-[#037ECC]/10 hover:text-[#037ECC] disabled:opacity-50" aria-label="Edit manual supervision">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(row.id)} disabled={disabled} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="Remove manual supervision">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return <CustomTable columns={columns} data={appointments} getRowKey={(row) => row.id} />
}
