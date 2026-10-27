"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarX2, ChevronDown, Search, User } from "lucide-react"
import { parseLocalDate } from "@/lib/date"
import type { EligibleServiceLog } from "@/lib/types/batch-claim.types"
import type { SelectedServiceLogSnapshot } from "../hooks/useBatchClaimForm"
import { cn } from "@/lib/utils"

interface EligibleServiceLogsPickerProps {
  serviceLogs: EligibleServiceLog[]
  isLoading: boolean
  hasSearched: boolean
  canSearch: boolean
  selectedIds: Set<string>
  selectedAppointmentIds: Set<string>
  existingAppointmentIdsByServiceLogId: Record<string, Set<string>>
  onToggle: (serviceLogId: string) => void
  onSetGroupSelected: (serviceLogIds: string[], selected: boolean) => void
  onToggleAppointment: (serviceLogId: string, appointmentId: string) => void
  isEdit: boolean
  /** Seleccionados fuera del resultado vigente (solo en edición) */
  orphanSelections: SelectedServiceLogSnapshot[]
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

function serviceLogUnits(sl: EligibleServiceLog): number {
  return sl.appointments.reduce((sum, a) => sum + (a.units || a.cantUnit), 0)
}

function Checkbox({ checked, onChange, ariaLabel }: { checked: boolean; onChange: () => void; ariaLabel: string }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#037ECC] focus:ring-[#037ECC]/20"
    />
  )
}

export function EligibleServiceLogsPicker({
  serviceLogs,
  isLoading,
  hasSearched,
  canSearch,
  selectedIds,
  selectedAppointmentIds,
  existingAppointmentIdsByServiceLogId,
  onToggle,
  onSetGroupSelected,
  onToggleAppointment,
  isEdit,
  orphanSelections,
  billingCodeLabels,
}: EligibleServiceLogsPickerProps) {
  const [clientFilter, setClientFilter] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const groups = useMemo(() => {
    const term = clientFilter.trim().toLowerCase()
    const filtered = term
      ? serviceLogs.filter((sl) => sl.clientName.toLowerCase().includes(term))
      : serviceLogs

    const byClient = new Map<string, EligibleServiceLog[]>()
    for (const sl of filtered) {
      const list = byClient.get(sl.clientId)
      if (list) list.push(sl)
      else byClient.set(sl.clientId, [sl])
    }
    return [...byClient.values()]
      .map((list) => ({
        clientId: list[0].clientId,
        clientName: list[0].clientName,
        serviceLogs: [...list].sort((a, b) => (a.initDate + a.providerName).localeCompare(b.initDate + b.providerName)),
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName))
  }, [serviceLogs, clientFilter])

  const totals = useMemo(() => {
    let logs = 0
    let appointments = 0
    let units = 0
    for (const sl of serviceLogs) {
      if (!selectedIds.has(sl.id)) continue
      logs += 1
      const existingIds = existingAppointmentIdsByServiceLogId[sl.id]
      const includedAppointments = sl.appointments.filter((appointment) =>
        selectedAppointmentIds.has(appointment.appointmentId) || (!isEdit && !existingIds),
      )
      appointments += includedAppointments.length
      units += includedAppointments.reduce((sum, appointment) => sum + (appointment.units || appointment.cantUnit), 0)
    }
    for (const orphan of orphanSelections) {
      logs += 1
      appointments += orphan.services.length
      units += orphan.services.reduce((sum, service) => sum + service.unitCount, 0)
    }
    return { logs, appointments, units }
  }, [serviceLogs, selectedIds, selectedAppointmentIds, existingAppointmentIdsByServiceLogId, isEdit, orphanSelections])

  if (!canSearch) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
        <CalendarX2 className="h-6 w-6 text-slate-300" />
        <p className="text-sm text-slate-500">Select a payer plan and a service period to load billable service logs</p>
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
          <p className="text-sm font-medium text-slate-600">No billable service logs in this period</p>
          <p className="max-w-md text-xs text-slate-400">
            A service log is billable when it contains appointments with a locked session note, caregiver signature and
            provider signature for the selected payer plan.
          </p>
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => {
            const groupIds = group.serviceLogs.map((sl) => sl.id)
            const selectedInGroup = groupIds.filter((id) => selectedIds.has(id)).length
            const allSelected = selectedInGroup === groupIds.length

            return (
              <div key={group.clientId} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* Client header */}
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onChange={() => onSetGroupSelected(groupIds, !allSelected)}
                    ariaLabel={`Select all service logs of ${group.clientName}`}
                  />
                  <User className="h-3.5 w-3.5 text-[#037ECC]" />
                  <span className="flex-1 text-sm font-semibold text-slate-800">{group.clientName}</span>
                  <span className="inline-flex items-center rounded-full bg-[#037ECC]/10 px-2 py-0.5 text-[11px] font-bold text-[#037ECC]">
                    {selectedInGroup}/{groupIds.length}
                  </span>
                </div>

                {/* Service log rows */}
                <div className="divide-y divide-slate-100">
                  {group.serviceLogs.map((sl) => {
                    const checked = selectedIds.has(sl.id)
                    const isExpanded = expandedIds.has(sl.id)
                    return (
                      <div key={sl.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleExpanded(sl.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              toggleExpanded(sl.id)
                            }
                          }}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            checked ? "bg-[#037ECC]/[0.04]" : "hover:bg-slate-50",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onChange={() => onToggle(sl.id)}
                            ariaLabel={`Select service log ${formatDate(sl.initDate)} – ${formatDate(sl.endDate)}`}
                          />
                          <span className="w-56 shrink-0 text-sm font-medium tabular-nums text-slate-700">
                            {formatDate(sl.initDate)} – {formatDate(sl.endDate)}
                          </span>
                          <span className="flex-1 truncate text-xs text-slate-600">{sl.providerName || "—"}</span>
                          <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                            {sl.appointments.length} appt{sl.appointments.length !== 1 ? "s" : ""}
                          </span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
                            {serviceLogUnits(sl)} units
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                              isExpanded ? "rotate-0" : "-rotate-90",
                            )}
                          />
                        </div>

                        {/* Existing appointments are retained; new ones require an explicit choice. */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                            <div className="divide-y divide-slate-100/80">
                              {sl.appointments.map((appt) => {
                                const existingIds = existingAppointmentIdsByServiceLogId[sl.id]
                                const alreadyIncluded = existingIds?.has(appt.appointmentId) ?? false
                                const checkedAppointment = selectedAppointmentIds.has(appt.appointmentId)
                                  || (!isEdit && !existingIds && checked)
                                return (
                                <div key={appt.appointmentId} className={cn(
                                  "flex items-center gap-3 py-1.5 pl-7 text-xs",
                                  isEdit && !alreadyIncluded && "bg-amber-50/70",
                                )}>
                                  <input
                                    type="checkbox"
                                    checked={checkedAppointment}
                                    disabled={alreadyIncluded}
                                    onChange={() => onToggleAppointment(sl.id, appt.appointmentId)}
                                    onClick={(event) => event.stopPropagation()}
                                    aria-label={`${alreadyIncluded ? "Included" : "Add"} appointment ${formatDate(appt.date)}`}
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#037ECC] focus:ring-[#037ECC]/20 disabled:cursor-default disabled:opacity-60"
                                  />
                                  <span className="w-24 font-medium tabular-nums text-slate-600">{formatDate(appt.date)}</span>
                                  <span className="w-24 tabular-nums text-slate-500">
                                    {formatTime(appt.timeInit)} – {formatTime(appt.timeEnd)}
                                  </span>
                                  <span className="flex-1 truncate text-slate-600">
                                    {billingCodeLabels[appt.billingCodeId] || "—"}
                                  </span>
                                  <span className="font-semibold tabular-nums text-slate-600">
                                    {appt.units || appt.cantUnit} units
                                  </span>
                                  <span className={cn(
                                    "w-20 text-right text-[10px] font-semibold uppercase tracking-wide",
                                    alreadyIncluded ? "text-emerald-600" : "text-amber-700",
                                  )}>
                                    {alreadyIncluded ? "Included" : "New"}
                                  </span>
                                </div>
                                )
                              })}
                              {sl.appointments.length === 0 && (
                                <p className="py-2 pl-7 text-xs italic text-slate-400">No appointments</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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
              These service logs belong to the batch but are not in the current result. Uncheck to remove them.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {orphanSelections.map((orphan) => {
              const isExpanded = expandedIds.has(orphan.serviceLogId)
              const hasServices = orphan.services.length > 0
              return (
                <div key={orphan.serviceLogId}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpanded(orphan.serviceLogId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleExpanded(orphan.serviceLogId)
                      }
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <Checkbox
                      checked
                      onChange={() => onToggle(orphan.serviceLogId)}
                      ariaLabel={`Remove service log from batch`}
                    />
                    <span className="w-56 shrink-0 text-sm font-medium tabular-nums text-slate-700">
                      {orphan.initDate ? `${formatDate(orphan.initDate)} – ${formatDate(orphan.endDate)}` : "Service log"}
                    </span>
                    <span className="flex-1 truncate text-xs text-slate-600">{orphan.clientName || orphan.serviceLogId}</span>
                    <span className="truncate text-xs text-slate-500">{orphan.providerName}</span>
                    <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                      {orphan.services.length} appt{orphan.services.length !== 1 ? "s" : ""}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                        isExpanded ? "rotate-0" : "-rotate-90",
                      )}
                    />
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                      <div className="divide-y divide-slate-100/80">
                        {orphan.services.map((service) => (
                          <div key={service.appointmentId} className="flex items-center gap-3 py-1.5 pl-7 text-xs">
                            <span className="w-24 font-medium tabular-nums text-slate-600">{formatDate(service.date)}</span>
                            <span className="w-24 tabular-nums text-slate-500">
                              {formatTime(service.timeIn)} – {formatTime(service.timeOut)}
                            </span>
                            <span className="flex-1 truncate text-slate-600">{service.units || "—"}</span>
                            <span className="font-semibold tabular-nums text-slate-600">{service.unitCount} units</span>
                          </div>
                        ))}
                        {!hasServices && (
                          <p className="py-2 pl-7 text-xs italic text-slate-400">
                            No appointment details available
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selection summary */}
      {(totals.logs > 0 || hasSearched) && !isLoading && (
        <div className="flex items-center justify-end gap-4 px-1 text-sm">
          <span className="text-slate-500">
            <span className="font-semibold tabular-nums text-slate-800">{totals.logs}</span> service log{totals.logs !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            <span className="font-semibold tabular-nums text-slate-800">{totals.appointments}</span> appointment{totals.appointments !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            <span className="font-semibold tabular-nums text-slate-800">{totals.units}</span> units
          </span>
        </div>
      )}
    </div>
  )
}
