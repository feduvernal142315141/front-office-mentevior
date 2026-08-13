"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarX2, Search, User } from "lucide-react"
import { parseLocalDate } from "@/lib/date"
import type { EligibleAppointment } from "@/lib/types/batch-claim.types"
import type { SelectedAppointmentSnapshot } from "../hooks/useBatchClaimForm"
import { cn } from "@/lib/utils"

interface EligibleAppointmentsPickerProps {
  appointments: EligibleAppointment[]
  isLoading: boolean
  hasSearched: boolean
  canSearch: boolean
  selectedIds: Set<string>
  onToggle: (appointmentId: string) => void
  onSetGroupSelected: (appointmentIds: string[], selected: boolean) => void
  /** Seleccionados fuera del resultado vigente (solo en edición) */
  orphanSelections: SelectedAppointmentSnapshot[]
  billingCodeLabels: Record<string, string>
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    return format(parseLocalDate(dateStr), "MMM dd, yyyy")
  } catch {
    return dateStr
  }
}

/** "09:00:00" → "09:00" */
function formatTime(time: string): string {
  return time ? time.slice(0, 5) : ""
}

function Checkbox({ checked, onChange, ariaLabel }: { checked: boolean; onChange: () => void; ariaLabel: string }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#037ECC] focus:ring-[#037ECC]/20"
    />
  )
}

export function EligibleAppointmentsPicker({
  appointments,
  isLoading,
  hasSearched,
  canSearch,
  selectedIds,
  onToggle,
  onSetGroupSelected,
  orphanSelections,
  billingCodeLabels,
}: EligibleAppointmentsPickerProps) {
  const [clientFilter, setClientFilter] = useState("")

  const groups = useMemo(() => {
    const term = clientFilter.trim().toLowerCase()
    const filtered = term
      ? appointments.filter((a) => a.clientName.toLowerCase().includes(term))
      : appointments

    const byClient = new Map<string, EligibleAppointment[]>()
    for (const appt of filtered) {
      const key = appt.clientId
      const list = byClient.get(key)
      if (list) list.push(appt)
      else byClient.set(key, [appt])
    }
    return [...byClient.values()]
      .map((list) => ({
        clientId: list[0].clientId,
        clientName: list[0].clientName,
        appointments: [...list].sort((a, b) => (a.date + a.timeInit).localeCompare(b.date + b.timeInit)),
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName))
  }, [appointments, clientFilter])

  const totalSelected = selectedIds.size
  const totalUnitsSelected = useMemo(() => {
    let units = 0
    for (const appt of appointments) {
      if (selectedIds.has(appt.id)) units += appt.units || appt.cantUnit
    }
    for (const orphan of orphanSelections) units += orphan.units
    return units
  }, [appointments, selectedIds, orphanSelections])

  if (!canSearch) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
        <CalendarX2 className="h-6 w-6 text-slate-300" />
        <p className="text-sm text-slate-500">Select a payer plan and a service period to load billable appointments</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Client filter (client-side) */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          placeholder="Filter by client name..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && hasSearched && groups.length === 0 && orphanSelections.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-10 text-center">
          <CalendarX2 className="h-6 w-6 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No billable appointments in this range</p>
          <p className="max-w-md text-xs text-slate-400">
            Only appointments with a locked session note, caregiver signature and provider signature are eligible.
          </p>
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => {
            const groupIds = group.appointments.map((a) => a.id)
            const selectedInGroup = groupIds.filter((id) => selectedIds.has(id)).length
            const allSelected = selectedInGroup === groupIds.length

            return (
              <div key={group.clientId} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* Group header */}
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onChange={() => onSetGroupSelected(groupIds, !allSelected)}
                    ariaLabel={`Select all appointments of ${group.clientName}`}
                  />
                  <User className="h-3.5 w-3.5 text-[#037ECC]" />
                  <span className="flex-1 text-sm font-semibold text-slate-800">{group.clientName}</span>
                  <span className="inline-flex items-center rounded-full bg-[#037ECC]/10 px-2 py-0.5 text-[11px] font-bold text-[#037ECC]">
                    {selectedInGroup}/{groupIds.length}
                  </span>
                </div>
                {/* Rows */}
                <div className="divide-y divide-slate-100">
                  {group.appointments.map((appt) => {
                    const checked = selectedIds.has(appt.id)
                    const billingLabel = billingCodeLabels[appt.billingCodeId]
                    return (
                      <label
                        key={appt.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
                          checked ? "bg-[#037ECC]/[0.04]" : "hover:bg-slate-50",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onChange={() => onToggle(appt.id)}
                          ariaLabel={`Select appointment on ${appt.date}`}
                        />
                        <span className="w-28 text-sm font-medium tabular-nums text-slate-700">{formatDate(appt.date)}</span>
                        <span className="w-24 text-xs tabular-nums text-slate-500">
                          {formatTime(appt.timeInit)} – {formatTime(appt.timeEnd)}
                        </span>
                        <span className="flex-1 truncate text-xs text-slate-600">{billingLabel || "—"}</span>
                        <span className="text-xs font-semibold tabular-nums text-slate-700">
                          {appt.units || appt.cantUnit} units
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected outside the current search (edit mode) */}
      {orphanSelections.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          <div className="border-b border-amber-100 bg-amber-50/70 px-4 py-2.5">
            <span className="text-sm font-semibold text-amber-800">Currently selected — outside this search</span>
            <p className="text-xs text-amber-600/90">
              These appointments belong to the batch but are not in the current result. Uncheck to remove them.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {orphanSelections.map((orphan) => (
              <label
                key={orphan.appointmentId}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
              >
                <Checkbox
                  checked
                  onChange={() => onToggle(orphan.appointmentId)}
                  ariaLabel={`Remove appointment on ${orphan.date}`}
                />
                <span className="w-28 text-sm font-medium tabular-nums text-slate-700">{formatDate(orphan.date)}</span>
                <span className="flex-1 truncate text-xs text-slate-600">{orphan.clientName}</span>
                <span className="truncate text-xs text-slate-600">{orphan.billingCode || "—"}</span>
                <span className="text-xs font-semibold tabular-nums text-slate-700">{orphan.units} units</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Selection summary */}
      {(totalSelected > 0 || hasSearched) && !isLoading && (
        <div className="flex items-center justify-end gap-4 px-1 text-sm">
          <span className="text-slate-500">
            <span className="font-semibold text-slate-800 tabular-nums">{totalSelected}</span> appointment{totalSelected !== 1 ? "s" : ""} selected
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            <span className="font-semibold text-slate-800 tabular-nums">{totalUnitsSelected}</span> units
          </span>
        </div>
      )}
    </div>
  )
}
