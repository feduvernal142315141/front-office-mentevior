"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { parseLocalDate } from "@/lib/date"
import { formatTimeTo12h } from "@/lib/utils/time-format"
import type { ManualEntryRow } from "../hooks/useManualEntryOptions"
import { formatHours, formatServiceType } from "./manual-entry-format"
import { TagList } from "./TagList"

interface ManualLogEntriesTableProps {
  rows: ManualEntryRow[]
  supervisorName?: string
  onEdit?: (key: string) => void
  onDelete?: (key: string) => void
  disabled?: boolean
}

function formatDate(value: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

function formatTime(value: string): string {
  return formatTimeTo12h(value.slice(0, 5)) || "—"
}

/** Las entradas manuales, con el estilo de las tablas del proyecto. Sin billing code va N/A, igual que el PDF */
export function ManualLogEntriesTable({ rows, supervisorName = "", onEdit, onDelete, disabled }: ManualLogEntriesTableProps) {
  const columns = useMemo<CustomTableColumn<ManualEntryRow>[]>(() => {
    const base: CustomTableColumn<ManualEntryRow>[] = [
      {
        key: "date",
        header: "Date",
        className: "whitespace-nowrap",
        render: (row) => <span className="font-medium text-slate-900">{formatDate(row.date)}</span>,
      },
      {
        key: "timeStart",
        header: "Time Started",
        className: "whitespace-nowrap",
        render: (row) => <span className="tabular-nums">{formatTime(row.timeStart)}</span>,
      },
      {
        key: "timeEnd",
        header: "Time Ended",
        className: "whitespace-nowrap",
        render: (row) => <span className="tabular-nums">{formatTime(row.timeEnd)}</span>,
      },
      {
        key: "duration",
        header: "Duration",
        align: "right",
        className: "whitespace-nowrap",
        render: (row) => <span className="font-semibold tabular-nums text-slate-900">{formatHours(row.duration)}</span>,
      },
      {
        key: "summary",
        header: "Summary",
        className: "min-w-[180px]",
        render: (row) => (
          <p
            className="line-clamp-2 whitespace-pre-line text-slate-600"
            title={row.description || undefined}
          >
            {row.description || "—"}
          </p>
        ),
      },
      {
        key: "billingCode",
        header: "Billing Code",
        className: "whitespace-nowrap",
        render: (row) => row.billingCode || <span className="text-slate-400">N/A</span>,
      },
      {
        key: "serviceType",
        header: "Service Type",
        className: "whitespace-nowrap",
        render: (row) => <ServiceTypeBadge value={row.serviceType} />,
      },
      {
        key: "participants",
        header: "Participants",
        className: "whitespace-nowrap",
        render: (row) => <TagList items={row.participants} />,
      },
      {
        key: "activityCategories",
        header: "Activity Category",
        className: "whitespace-nowrap",
        render: (row) => <TagList items={row.activityCategories} />,
      },
      {
        key: "modality",
        header: "Case Supervision Modality",
        className: "whitespace-nowrap",
        render: (row) => row.modality || <span className="text-slate-400">—</span>,
      },
      {
        key: "supervisor",
        header: "Supervisor",
        className: "whitespace-nowrap",
        render: () => supervisorName || <span className="text-slate-400">—</span>,
      },
    ]

    if (!onEdit && !onDelete) return base

    return [
      ...base,
      {
        key: "actions",
        header: "Actions",
        align: "right",
        className: "whitespace-nowrap",
        render: (row) => (
          <div className="inline-flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(row.key)}
                disabled={disabled}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#037ECC]/10 hover:text-[#037ECC] disabled:opacity-50"
                title="Edit entry"
                aria-label="Edit entry"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(row.key)}
                disabled={disabled}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                title="Remove entry"
                aria-label="Remove entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ]
  }, [onEdit, onDelete, disabled, supervisorName])

  return <CustomTable columns={columns} data={rows} getRowKey={(row) => row.key} />
}

export function ServiceTypeBadge({ value }: { value: string }) {
  if (!value) return <span className="text-slate-400">—</span>
  const isDirect = value.toUpperCase() === "DIRECT"
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isDirect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {formatServiceType(value)}
    </span>
  )
}
