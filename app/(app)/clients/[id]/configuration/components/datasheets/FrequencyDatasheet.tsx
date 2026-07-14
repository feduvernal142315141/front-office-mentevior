"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart3, Hash, FileText,
  Minus, Plus, CalendarCheck2,
} from "lucide-react"
import { addDays, format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import { updateBaselineValues } from "@/lib/modules/client-service-plan/services/client-data-collection.service"
import { useClientDataCollectionValues } from "@/lib/modules/client-service-plan/hooks/use-client-data-collection-values"
import { useClientAppointments } from "@/lib/modules/schedules/hooks/use-client-appointments"
import { upsertClientDataCollectionValue } from "@/lib/modules/client-service-plan/services/client-data-collection-values.service"
import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { useFrequencyDatasheet } from "./useFrequencyDatasheet"
import { useChartDateRange } from "./useChartDateRange"
import { useChartData } from "./useChartData"
import { ChartDateRangeToolbar } from "./ChartDateRangeToolbar"
import { getDateKey, parseLocalDate } from "./frequency-datasheet.types"
import { FrequencyChart } from "./FrequencyChart"
import {
  DatasheetHeader, RowLabel, NoteButton, SaveBar, EnvironmentalChangesLegend, AnimatePresence,
} from "./shared-datasheet-components"

interface FrequencyDatasheetProps {
  clientId: string
  activeItem: ClientServicePlanCategoryMappedItem
  categoryTypeName: string
  dcConfig: DataCollectionConfig | null
  onItemsReload?: () => Promise<void>
}

export function FrequencyDatasheet({ clientId, activeItem, categoryTypeName, dcConfig, onItemsReload }: FrequencyDatasheetProps) {
  const ds = useFrequencyDatasheet(activeItem.baseline)

  // --- Compute visible days FIRST (no dependency on fetched data) ---
  const gapDateKeys = useMemo(() => {
    const bls = activeItem.baseline
    if (!bls || bls.length === 0) return new Set<string>()
    const blDates = bls.filter((b) => b.date).map((b) => parseLocalDate(b.date))
    if (blDates.length === 0) return new Set<string>()
    const blDateKeys = new Set(blDates.map((d) => getDateKey(d)))
    const firstBlTime = Math.min(...blDates.map((d) => d.getTime()))
    const lastBlTime = Math.max(...blDates.map((d) => d.getTime()))
    const objs = activeItem.objetive
    const stoTimes = (objs ?? []).filter((o) => o.startDate).map((o) => parseLocalDate(o.startDate).getTime())
    const endBoundary = stoTimes.length > 0 ? Math.min(...stoTimes) : lastBlTime + 1
    if (endBoundary <= firstBlTime) return new Set<string>()
    const keys = new Set<string>()
    const cursor = new Date(firstBlTime)
    cursor.setDate(cursor.getDate() + 1)
    while (cursor.getTime() <= lastBlTime) {
      const key = getDateKey(cursor)
      if (!blDateKeys.has(key)) keys.add(key)
      cursor.setDate(cursor.getDate() + 1)
    }
    const gapCursor = new Date(lastBlTime)
    gapCursor.setDate(gapCursor.getDate() + 1)
    while (gapCursor.getTime() < endBoundary) {
      keys.add(getDateKey(gapCursor))
      gapCursor.setDate(gapCursor.getDate() + 1)
    }
    return keys
  }, [activeItem.baseline, activeItem.objetive])

  // For week mode: fill to 7 visible days (extend beyond week if gaps hide some)
  // For month/custom: show all non-gap days in range
  const visibleDays = useMemo(() => {
    const filtered = ds.rangeDays.filter((day) => !gapDateKeys.has(getDateKey(day)))
    if (ds.rangeMode !== "week") return filtered
    const needed = 7 - filtered.length
    if (needed <= 0) return filtered
    const lastRangeDay = ds.rangeDays[ds.rangeDays.length - 1]
    const extended = [...filtered]
    let cursor = lastRangeDay
    while (extended.length < 7) {
      cursor = addDays(cursor, 1)
      if (!gapDateKeys.has(getDateKey(cursor))) extended.push(cursor)
    }
    return extended
  }, [ds.rangeDays, ds.rangeMode, gapDateKeys])

  // Fetch range: cover all visible days
  const fetchStart = useMemo(() => {
    const first = visibleDays[0] ?? ds.dateRange.start
    return format(first, "yyyy-MM-dd")
  }, [visibleDays, ds.dateRange.start])

  const fetchEnd = useMemo(() => {
    const last = visibleDays[visibleDays.length - 1] ?? ds.dateRange.end
    return format(last, "yyyy-MM-dd")
  }, [visibleDays, ds.dateRange.end])

  // Fetch DC values + appointments for visible range
  const dcValues = useClientDataCollectionValues({
    clientServicePlanCategoryItemId: activeItem.id,
    startDate: fetchStart,
    endDate: fetchEnd,
  })

  const clientAppointments = useClientAppointments({
    clientId,
    dateFrom: fetchStart,
    dateTo: fetchEnd,
  })

  // Seed DC values from API into grid entries + snapshot atomically
  const seededDcRef = useRef<string | null>(null)
  useEffect(() => {
    const records = dcValues.records
    if (records.length === 0) {
      seededDcRef.current = null
      return
    }
    const fingerprint = records.map((r) => `${r.id}:${r.value}`).sort().join(",")
    if (seededDcRef.current === fingerprint) return
    seededDcRef.current = fingerprint

    ds.seedDcRecords(
      records.map((rec) => ({ dateKey: rec.date.slice(0, 10), value: rec.value }))
    )
  }, [dcValues.records, ds])

  // --- Baseline save ---
  const [baselineSaveState, setBaselineSaveState] = useState<"idle" | "saving" | "success">("idle")
  const handleSaveBaseline = useCallback(async () => {
    const changed = ds.getChangedBaselines()
    if (changed.length === 0) return
    setBaselineSaveState("saving")
    try {
      await updateBaselineValues(changed)
      ds.commitBaseline()
      setBaselineSaveState("success")
      setTimeout(() => setBaselineSaveState("idle"), 1500)
    } catch {
      setBaselineSaveState("idle")
    }
  }, [ds])

  // --- DC values save ---
  const [dcSaveState, setDcSaveState] = useState<"idle" | "saving" | "success">("idle")
  const handleSaveDcValues = useCallback(async () => {
    const changedKeys = ds.getChangedDcDateKeys()
    if (changedKeys.length === 0) return
    setDcSaveState("saving")
    try {
      const promises = changedKeys.map((dateKey) => {
        const appointment = clientAppointments.appointmentsByDate.get(dateKey)
        if (!appointment) return Promise.resolve()
        const entry = ds.getEntry(dateKey)
        return upsertClientDataCollectionValue({
          clientServicePlanCategoryItemId: activeItem.id,
          appointmentId: appointment.id,
          value: entry.occurrences,
        })
      })
      await Promise.all(promises)
      ds.commitDcValues()
      await dcValues.refetch()
      // Reload items to pick up objective status changes from backend auto-evaluation
      await onItemsReload?.()
      setDcSaveState("success")
      setTimeout(() => setDcSaveState("idle"), 1500)
    } catch {
      setDcSaveState("idle")
    }
  }, [ds, clientAppointments.appointmentsByDate, activeItem.id, dcValues, onItemsReload])

  // Chart
  const firstBaselineDate = useMemo(() => {
    const bls = activeItem.baseline
    if (!bls || bls.length === 0) return undefined
    const sorted = [...bls]
      .filter((b) => b.date)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    return sorted.length > 0 ? parseLocalDate(sorted[0].date) : undefined
  }, [activeItem.baseline])

  const chartRange = useChartDateRange("1W", firstBaselineDate)
  const extendedChartDays = useMemo(() => {
    const original = chartRange.chartDays
    const gapCount = original.filter((day) => gapDateKeys.has(getDateKey(day))).length
    if (gapCount === 0) return original
    const lastDay = original[original.length - 1]
    const extended = [...original]
    let cursor = lastDay
    let added = 0
    while (added < gapCount) { cursor = addDays(cursor, 1); extended.push(cursor); added++ }
    return extended
  }, [chartRange.chartDays, gapDateKeys])

  // Aggregation method from DC config (TOTAL or AVERAGE)
  const aggregationMethod = dcConfig?.weeklyDailyValue ?? ServicePlanValueType.TOTAL

  // Chart data with independent fetch + aggregation
  const chartData = useChartData({
    clientServicePlanCategoryItemId: activeItem.id,
    chartDays: extendedChartDays,
    interval: chartRange.interval,
    aggregationMethod,
    baselines: activeItem.baseline,
    objectives: activeItem.objetive,
    gridEntries: ds.entries,
  })

  // Map date → appointment status from DC records (for editable check)
  const dcStatusByDate = useMemo(() => {
    const map = new Map<string, string>()
    for (const rec of dcValues.records) {
      if (rec.appointmentStatusName) {
        map.set(rec.date.slice(0, 10), rec.appointmentStatusName)
      }
    }
    return map
  }, [dcValues.records])

  const gridCols = `200px repeat(${visibleDays.length}, minmax(${ds.rangeMode === "month" ? "80" : "120"}px, 1fr))`

  return (
    <div className="space-y-4">
      {/* ─── Premium Header ─── */}
      <DatasheetHeader
        rangeMode={ds.rangeMode}
        periodLabel={ds.periodLabel}
        monthYearLabel={ds.monthYearLabel}
        dateRange={ds.dateRange}
        staffAvatars={ds.staffAvatars}
        staffCount={ds.staffCount}
        minDate={ds.minDate}
        canGoPrev={ds.canGoPrev}
        onPrev={ds.goToPrev}
        onNext={ds.goToNext}
        onToday={ds.goToToday}
        onChangeMode={ds.changeMode}
        onGoToDate={ds.goToDate}
        onSetRange={ds.setRange}
      />

      {/* ─── Grid ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[45vh]">
          <div className={ds.rangeMode === "month" ? "min-w-[1400px]" : "min-w-[1080px]"}>
            {/* Column Headers — sticky on vertical scroll */}
            <div className="grid border-b border-slate-100 sticky top-0 z-10 bg-white" style={{ gridTemplateColumns: gridCols }}>
              <div className="px-4 py-3 bg-slate-50/60 border-r border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Measurement Row
                </span>
              </div>
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                const hasAppointment = clientAppointments.appointmentsByDate.has(key)
                return (
                  <div key={key} className={cn(
                    "flex flex-col items-center justify-center py-3 gap-1",
                    isBaseline && "bg-red-50/60",
                    today && !isBaseline && "bg-[#037ECC]/[0.03]",
                  )}>
                    <div className={cn(
                      "flex flex-col items-center justify-center rounded-full",
                      ds.rangeMode === "month" ? "w-10 h-10" : "w-14 h-14",
                      today
                        ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white shadow-md ring-2 ring-[#037ECC]/20 ring-offset-2"
                        : "bg-slate-100 text-slate-700"
                    )}>
                      <span className={cn("font-bold leading-none", ds.rangeMode === "month" ? "text-sm" : "text-lg")}>{format(day, "dd")}</span>
                      <span className={cn("font-semibold uppercase leading-none mt-0.5", ds.rangeMode === "month" ? "text-[8px]" : "text-[10px]", today ? "text-white/80" : "text-slate-400")}>
                        {format(day, "MMM")}
                      </span>
                    </div>
                    {!isBaseline && dcStatusByDate.get(key) === "In Progress" && (
                      <div className="flex items-center gap-0.5" title="In Progress">
                        <CalendarCheck2 className="h-3 w-3 text-emerald-500" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Row: Number of Occurrences */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel icon={<BarChart3 className="h-4 w-4 text-[#037ECC]" />} title="Number of occurrences" badge="Mandatory Field" badgeColor="blue" />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                const hasAppointment = clientAppointments.appointmentsByDate.has(key)
                const appointmentStatus = dcStatusByDate.get(key)
                const isInProgress = appointmentStatus === "In Progress"
                const isEditable = isBaseline || isInProgress
                return (
                  <div key={key} className={cn(
                    "flex items-center justify-center px-2 py-3",
                    isBaseline && "bg-red-50/60",
                    today && !isBaseline && "bg-[#037ECC]/[0.03]",
                    !isEditable && "opacity-40",
                  )}>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                      <button type="button" onClick={() => ds.decrementOccurrences(key)} disabled={entry.occurrences === 0 || !isEditable}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400">
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <input type="text" inputMode="numeric" value={entry.occurrences || ""} disabled={!isEditable}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); ds.setOccurrences(key, v === "" ? 0 : parseInt(v, 10)) }}
                        className="h-8 w-10 rounded-lg bg-white border border-slate-200 text-center text-sm font-semibold text-slate-800 tabular-nums outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                        placeholder="0" />
                      <button type="button" onClick={() => ds.incrementOccurrences(key)} disabled={!isEditable}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#037ECC] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400">
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Row: Occurrence Marks */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel icon={<Hash className="h-4 w-4 text-slate-400" />} title="Occurrences" />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                const count = entry.occurrences || 0
                return (
                  <div key={key} className={cn("px-2 py-3", isBaseline && "bg-red-50/60", today && !isBaseline && "bg-[#037ECC]/[0.03]")}>
                    {count > 0 ? (
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: count }, (_, i) => (
                          <div key={i} className="h-7 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-400 flex items-center justify-center">X</div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-7"><span className="text-xs text-slate-300">—</span></div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Row: Environmental Changes */}
            <div className="grid" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel icon={<FileText className="h-4 w-4 text-teal-500" />} title="Environmental changes" badge="Affects Chart Phase Lines" badgeColor="teal" />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const hasNote = entry.environmentalNote.trim().length > 0
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                return (
                  <div key={key} className={cn("flex items-center justify-center px-2 py-3", isBaseline && "bg-red-50/60", today && !isBaseline && "bg-[#037ECC]/[0.03]")}>
                    <NoteButton value={entry.environmentalNote} onChange={(v) => ds.setNote(key, v)} dateLabel={format(day, "MMM dd")} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save Bars */}
      <AnimatePresence>
        {ds.hasBaselineChanges && (
          <SaveBar label="Unsaved baseline changes" sublabel="You have modified baseline values" saveLabel="Save Baseline" saveState={baselineSaveState} onSave={handleSaveBaseline} onDiscard={ds.resetBaseline} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {ds.hasDcChanges && (
          <SaveBar label="Unsaved data collection changes" sublabel="You have modified session values" saveLabel="Save Data Collection" saveState={dcSaveState} onSave={handleSaveDcValues} onDiscard={ds.resetDcValues} accentColor="emerald" />
        )}
      </AnimatePresence>

      {/* Chart */}
      <div className="space-y-3">
        <ChartDateRangeToolbar preset={chartRange.preset} rangeLabel={chartRange.rangeLabel} isAtToday={chartRange.isAtToday} interval={chartRange.interval} presetsDisabled={chartRange.presetsDisabled} onPresetChange={chartRange.setPreset} onIntervalChange={chartRange.setInterval} onPrev={chartRange.goToPrev} onNext={chartRange.goToNext} onToday={chartRange.goToToday} />
        <FrequencyChart weekDays={ds.weekDays} entries={ds.entries} dcConfig={dcConfig} chartDays={extendedChartDays} tickInterval={chartRange.tickInterval} itemBaselines={activeItem.baseline} itemObjectives={activeItem.objetive} gapDateKeys={gapDateKeys} aggregatedData={chartData.aggregatedPoints} interval={chartRange.interval} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3.5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {ds.rangeMode === "month" ? "Monthly Total" : "Weekly Total"}
            </span>
            <span className="text-xl font-bold text-slate-800 tabular-nums leading-tight">{ds.weeklyTotal}</span>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly Average</span>
            <span className="text-xl font-bold tabular-nums leading-tight bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              {ds.monthlyAverage === 0 ? "—" : ds.monthlyAverage.toFixed(1)}
            </span>
          </div>
        </div>
        {ds.eventsLoggedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 border border-teal-200/60">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-600">{ds.eventsLoggedCount} event{ds.eventsLoggedCount !== 1 ? "s" : ""} logged</span>
          </div>
        )}
      </div>

      <EnvironmentalChangesLegend entries={ds.entries} />
    </div>
  )
}

