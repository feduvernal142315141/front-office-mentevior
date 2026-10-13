"use client"

import { format } from "date-fns"
import { parseLocalDate } from "@/lib/date"
import type { CaseSupervisionManualEntry } from "@/lib/types/case-supervision-log.types"
import { formatTimeTo12h } from "@/lib/utils/time-format"

interface ManualLogEntriesTableProps {
  entries: CaseSupervisionManualEntry[]
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

function formatDuration(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Las entradas manuales guardadas, en lectura. Sin billing code se muestra N/A, igual que el PDF */
export function ManualLogEntriesTable({ entries }: ManualLogEntriesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse">
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <tr key={entry.id} className="align-top transition-colors hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900">
                {formatDate(entry.date)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-slate-600">
                {formatTimeRange(entry.timeStart, entry.timeEnd)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">
                {formatDuration(entry.duration)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                {entry.billingCode || "N/A"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                {entry.serviceType || "—"}
              </td>
              <td className="px-3 py-3 text-sm leading-snug text-slate-600">
                {entry.activityCategories.map((c) => c.name).join(", ") || "—"}
              </td>
              <td className="px-3 py-3 text-sm leading-snug text-slate-600">
                {entry.participants.map((p) => p.catalogName).filter(Boolean).join(", ") || "—"}
              </td>
              <td className="px-3 py-3 text-sm leading-snug text-slate-600">
                {[entry.clientAddressPlaceServiceName, entry.modalityName].filter(Boolean).join(" · ") || "—"}
              </td>
              <td className="px-3 py-3 text-sm leading-snug text-slate-600 whitespace-pre-line">
                {entry.characteristic || "—"}
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
