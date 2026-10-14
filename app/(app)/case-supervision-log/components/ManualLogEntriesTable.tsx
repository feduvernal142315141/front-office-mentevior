"use client"

import { format } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"
import { parseLocalDate } from "@/lib/date"
import { formatTimeTo12h } from "@/lib/utils/time-format"
import type { ManualEntryRow } from "../hooks/useManualEntryOptions"
import { formatHours, formatServiceType } from "./manual-entry-format"

interface ManualLogEntriesTableProps {
  rows: ManualEntryRow[]
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

function formatTimeRange(start: string, end: string): string {
  const from = formatTimeTo12h(start.slice(0, 5))
  const to = formatTimeTo12h(end.slice(0, 5))
  if (!from && !to) return "—"
  return `${from || "—"} – ${to || "—"}`
}

/** Las entradas manuales en tabla. Sin billing code se muestra N/A, igual que el PDF */
export function ManualLogEntriesTable({ rows, onEdit, onDelete, disabled }: ManualLogEntriesTableProps) {
  const hasActions = !!onEdit || !!onDelete

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>Date</Th>
            <Th>Time</Th>
            <Th align="right">Hours</Th>
            <Th>Billing Code</Th>
            <Th>Service Type</Th>
            <Th>Activity Category</Th>
            <Th>Participants</Th>
            <Th>Location</Th>
            <Th>Summary of Activity</Th>
            {hasActions && <Th align="right">Actions</Th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.key} className="align-top transition-colors hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900">
                {formatDate(row.date)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-slate-600">
                {formatTimeRange(row.timeStart, row.timeEnd)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">
                {formatHours(row.duration)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">{row.billingCode || "N/A"}</td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                {formatServiceType(row.serviceType)}
              </td>
              <td className="px-3 py-3 text-sm leading-snug text-slate-600">{row.activityCategories || "—"}</td>
              <td className="px-3 py-3 text-sm leading-snug text-slate-600">{row.participants || "—"}</td>
              <td className="px-3 py-3 text-sm leading-snug text-slate-600">{row.location || "—"}</td>
              <td className="max-w-[260px] px-3 py-3 text-sm leading-snug text-slate-600 whitespace-pre-line">
                {row.description || "—"}
              </td>
              {hasActions && (
                <td className="whitespace-nowrap px-3 py-2 text-right">
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
                </td>
              )}
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
