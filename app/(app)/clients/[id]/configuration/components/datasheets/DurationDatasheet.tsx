"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart3, FileText, User, CalendarCheck2,
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
import { useDurationDatasheet } from "./useDurationDatasheet"
import { useChartDateRange } from "./useChartDateRange"
import { useChartData } from "./useChartData"
import { ChartDateRangeToolbar } from "./ChartDateRangeToolbar"
import { getDateKey, parseLocalDate, calculateDailyAggregate } from "./duration-datasheet.types"
import { DurationChart } from "./DurationChart"
import {
  DatasheetHeader, RowLabel, NoteButton, SaveBar, EnvironmentalChangesLegend, AnimatePresence,
} from "./shared-datasheet-components"
import { ActiveObjectiveBanner } from "./ActiveObjectiveBanner"

interface DurationDatasheetProps {
  clientId: string
  activeItem: ClientServicePlanCategoryMappedItem
  categoryTypeName: string
  dcConfig: DataCollectionConfig | null
  appointmentId?: string
  onItemsReload?: () => Promise<void>
}

export function DurationDatasheet({ clientId, activeItem, categoryTypeName, dcConfig, appointmentId, onItemsReload }: DurationDatasheetProps) {
  const numberOfRecordings = dcConfig?.suggestedNumberOfRecordings ?? 10
  const unitOfTime = dcConfig?.unitOfTime ?? "SECONDS"
  const unitLabel = unitOfTime === "SECONDS" ? "Seconds" : unitOfTime === "MINUTES" ? "Minutes" : unitOfTime === "HOURS" ? "Hours" : "Days"
  const dailyValueMethod = (dcConfig?.dailyValue as ServicePlanValueType) ?? ServicePlanValueType.TOTAL
  const weeklyValueMethod = (dcConfig?.weeklyDailyValue as ServicePlanValueType) ?? ServicePlanValueType.TOTAL
  const dailyLabel = dailyValueMethod === ServicePlanValueType.TOTAL ? "Daily total" : "Daily average"
  const weeklyLabel = weeklyValueMethod === ServicePlanValueType.TOTAL ? "Weekly total" : "Weekly average"

  const ds = useDurationDatasheet(numberOfRecordings, dailyValueMethod, weeklyValueMethod, activeItem.baseline)

  // Gap detection
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
    while (cursor.getTime() <= lastBlTime) { const key = getDateKey(cursor); if (!blDateKeys.has(key)) keys.add(key); cursor.setDate(cursor.getDate() + 1) }
    const gapCursor = new Date(lastBlTime); gapCursor.setDate(gapCursor.getDate() + 1)
    while (gapCursor.getTime() < endBoundary) { keys.add(getDateKey(gapCursor)); gapCursor.setDate(gapCursor.getDate() + 1) }
    return keys
  }, [activeItem.baseline, activeItem.objetive])

  const visibleDays = useMemo(() => {
    const filtered = ds.rangeDays.filter((day) => !gapDateKeys.has(getDateKey(day)))
    if (ds.rangeMode !== "week") return filtered
    const needed = 7 - filtered.length
    if (needed <= 0) return filtered
    const lastRangeDay = ds.rangeDays[ds.rangeDays.length - 1]
    const extended = [...filtered]
    let cursor = lastRangeDay
    while (extended.length < 7) { cursor = addDays(cursor, 1); if (!gapDateKeys.has(getDateKey(cursor))) extended.push(cursor) }
    return extended
  }, [ds.rangeDays, ds.rangeMode, gapDateKeys])

  const fetchStart = useMemo(() => format(visibleDays[0] ?? ds.dateRange.start, "yyyy-MM-dd"), [visibleDays, ds.dateRange.start])
  const fetchEnd = useMemo(() => format(visibleDays[visibleDays.length - 1] ?? ds.dateRange.end, "yyyy-MM-dd"), [visibleDays, ds.dateRange.end])

  const dcValues = useClientDataCollectionValues({ clientServicePlanCategoryItemId: activeItem.id, startDate: fetchStart, endDate: fetchEnd })
  const clientAppointments = useClientAppointments({ clientId, dateFrom: fetchStart, dateTo: fetchEnd })

  // Seed DC values
  const seededDcRef = useRef<string | null>(null)
  useEffect(() => {
    const records = dcValues.records
    if (records.length === 0) { seededDcRef.current = null; return }
    const fingerprint = records.map((r) => `${r.id}:${r.value}:${r.environmentalChange ?? ""}`).sort().join(",")
    if (seededDcRef.current === fingerprint) return
    seededDcRef.current = fingerprint
    ds.seedDcRecords(records.map((rec) => ({ dateKey: rec.date.slice(0, 10), value: rec.value, environmentalChange: rec.environmentalChange })))
  }, [dcValues.records, ds])

  // Baseline save
  const [baselineSaveState, setBaselineSaveState] = useState<"idle" | "saving" | "success">("idle")
  const handleSaveBaseline = useCallback(async () => {
    const changed = ds.getChangedBaselines()
    if (changed.length === 0) return
    setBaselineSaveState("saving")
    try { await updateBaselineValues(changed); ds.commitBaseline(); setBaselineSaveState("success"); setTimeout(() => setBaselineSaveState("idle"), 1500) }
    catch { setBaselineSaveState("idle") }
  }, [ds])

  // DC save - stores daily aggregate
  const [dcSaveState, setDcSaveState] = useState<"idle" | "saving" | "success">("idle")
  const handleSaveDcValues = useCallback(async () => {
    const changedKeys = ds.getChangedDcDateKeys()
    if (changedKeys.length === 0) return
    setDcSaveState("saving")
    try {
      const promises = changedKeys.map((dateKey) => {
        const appointment = clientAppointments.appointmentsByDate.get(dateKey)
        const resolvedAppointmentId = appointmentId ?? appointment?.id ?? null
        const entry = ds.getEntry(dateKey)
        const agg = calculateDailyAggregate(entry, dailyValueMethod)
        if (agg === null) return Promise.resolve()
        return upsertClientDataCollectionValue({
          clientServicePlanCategoryItemId: activeItem.id,
          appointmentId: resolvedAppointmentId,
          date: dateKey,
          value: Math.round(agg * 100) / 100,
          environmentalChange: entry.environmentalNote.trim() || null,
        })
      })
      await Promise.all(promises)
      ds.commitDcValues()
      await dcValues.refetch()
      await onItemsReload?.()
      setDcSaveState("success")
      setTimeout(() => setDcSaveState("idle"), 1500)
    } catch { setDcSaveState("idle") }
  }, [ds, clientAppointments.appointmentsByDate, activeItem.id, dcValues, onItemsReload, dailyValueMethod])

  // Chart
  const firstBaselineDate = useMemo(() => {
    const bls = activeItem.baseline
    if (!bls || bls.length === 0) return undefined
    const sorted = [...bls].filter((b) => b.date).sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    return sorted.length > 0 ? parseLocalDate(sorted[0].date) : undefined
  }, [activeItem.baseline])

  const chartRange = useChartDateRange("1W", firstBaselineDate)
  const extendedChartDays = useMemo(() => {
    const original = chartRange.chartDays
    const gapCount = original.filter((day) => gapDateKeys.has(getDateKey(day))).length
    if (gapCount === 0) return original
    const lastDay = original[original.length - 1]
    const extended = [...original]
    let cursor = lastDay; let added = 0
    while (added < gapCount) { cursor = addDays(cursor, 1); extended.push(cursor); added++ }
    return extended
  }, [chartRange.chartDays, gapDateKeys])

  const aggregationMethod = weeklyValueMethod

  // Build frequency-compatible entries for chart
  const chartCompatibleEntries = useMemo(() => {
    const result: Record<string, { occurrences: number; initials: string; environmentalNote: string }> = {}
    for (const [key, entry] of Object.entries(ds.entries)) {
      const agg = calculateDailyAggregate(entry, dailyValueMethod)
      result[key] = { occurrences: agg ?? 0, initials: entry.initials, environmentalNote: entry.environmentalNote }
    }
    return result
  }, [ds.entries, dailyValueMethod])

  const chartData = useChartData({
    clientServicePlanCategoryItemId: activeItem.id,
    chartDays: extendedChartDays,
    interval: chartRange.interval,
    aggregationMethod,
    baselines: activeItem.baseline,
    objectives: activeItem.objetive,
    gridEntries: chartCompatibleEntries,
  })

  const dcStatusByDate = useMemo(() => {
    const map = new Map<string, string>()
    for (const rec of dcValues.records) { if (rec.appointmentStatusName) map.set(rec.date.slice(0, 10), rec.appointmentStatusName) }
    return map
  }, [dcValues.records])

  const gridCols = `200px repeat(${visibleDays.length}, minmax(${ds.rangeMode === "month" ? "80" : "120"}px, 1fr))`

  return (
    <div className="space-y-4">
      <DatasheetHeader
        rangeMode={ds.rangeMode} periodLabel={ds.periodLabel} monthYearLabel={ds.monthYearLabel}
        dateRange={ds.dateRange} staffAvatars={ds.staffAvatars} staffCount={ds.staffCount}
        minDate={ds.minDate} canGoPrev={ds.canGoPrev}
        onPrev={ds.goToPrev} onNext={ds.goToNext} onToday={ds.goToToday}
        onChangeMode={ds.changeMode} onGoToDate={ds.goToDate} onSetRange={ds.setRange}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[min(35vh,340px)]">
          <div className={ds.rangeMode === "month" ? "min-w-[1400px]" : "min-w-[1080px]"}>
            {/* Column Headers */}
            <div className="grid border-b border-slate-100 sticky top-0 z-10 bg-white" style={{ gridTemplateColumns: gridCols }}>
              <div className="px-4 py-3 bg-slate-50/60 border-r border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recording</span>
              </div>
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                return (
                  <div key={key} className={cn("flex flex-col items-center justify-center py-3 gap-1", isBaseline && "bg-red-50/60", today && !isBaseline && "bg-[#037ECC]/[0.03]")}>
                    <div className={cn("flex flex-col items-center justify-center rounded-full", ds.rangeMode === "month" ? "w-10 h-10" : "w-14 h-14", today ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white shadow-md ring-2 ring-[#037ECC]/20 ring-offset-2" : "bg-slate-100 text-slate-700")}>
                      <span className={cn("font-bold leading-none", ds.rangeMode === "month" ? "text-sm" : "text-lg")}>{format(day, "dd")}</span>
                      <span className={cn("font-semibold uppercase leading-none mt-0.5", ds.rangeMode === "month" ? "text-[8px]" : "text-[10px]", today ? "text-white/80" : "text-slate-400")}>{format(day, "MMM")}</span>
                    </div>
                    {!isBaseline && clientAppointments.appointmentsByDate.get(key)?.status === "InProgress" && (
                      <div className="flex items-center gap-0.5" title="In Progress"><CalendarCheck2 className="h-3 w-3 text-emerald-500" /></div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Recording Rows */}
            {Array.from({ length: numberOfRecordings }, (_, idx) => (
              <div key={idx} className="grid border-b border-slate-100" style={{ gridTemplateColumns: gridCols }}>
                <RowLabel icon={<BarChart3 className="h-4 w-4 text-[#037ECC]" />} title={`Recording ${idx + 1}`} />
                {visibleDays.map((day) => {
                  const key = getDateKey(day)
                  const entry = ds.getEntry(key)
                  const today = ds.isToday(day)
                  const isBaseline = ds.isBaselineDate(key)
                  const isInProgress = clientAppointments.appointmentsByDate.get(key)?.status === "InProgress"
                  const isEditable = isBaseline || isInProgress
                  const value = entry.recordings[idx]
                  return (
                    <div key={key} className={cn("flex items-center justify-center px-2 py-2", isBaseline && "bg-red-50/60", today && !isBaseline && "bg-[#037ECC]/[0.03]", !isEditable && "opacity-40")}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={value !== null ? String(value) : ""}
                        disabled={!isEditable}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, "")
                          if (raw === "") { ds.setRecording(key, idx, null); return }
                          const num = parseFloat(raw)
                          if (!isNaN(num)) ds.setRecording(key, idx, num)
                        }}
                        className="h-8 w-16 rounded-lg bg-white border border-slate-200 text-center text-sm font-semibold text-slate-800 tabular-nums outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                        placeholder="—"
                      />
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Row: Daily Total/Average */}
            <div className="grid border-b border-slate-100 bg-slate-50/40" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel icon={<BarChart3 className="h-4 w-4 text-indigo-500" />} title={dailyLabel} badgeColor="blue" />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                const agg = calculateDailyAggregate(entry, dailyValueMethod)
                return (
                  <div key={key} className={cn("flex items-center justify-center px-2 py-3", isBaseline && "bg-red-50/60", today && !isBaseline && "bg-[#037ECC]/[0.03]")}>
                    {agg !== null ? (
                      <span className="text-sm font-bold text-indigo-600 tabular-nums">{Number.isInteger(agg) ? agg : agg.toFixed(1)}</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Row: Initials */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel icon={<User className="h-4 w-4 text-slate-400" />} title="Initials" />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                return (
                  <div key={key} className={cn("flex items-center justify-center px-2 py-3", isBaseline && "bg-red-50/60", today && !isBaseline && "bg-[#037ECC]/[0.03]")}>
                    <input type="text" value={entry.initials} onChange={(e) => ds.setInitials(key, e.target.value)} maxLength={3}
                      className="h-8 w-14 rounded-lg bg-white border border-slate-200 text-center text-xs font-semibold text-slate-700 uppercase outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all" placeholder="—" />
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
          <SaveBar label="Unsaved data collection changes" sublabel="You have modified recording values" saveLabel="Save Data Collection" saveState={dcSaveState} onSave={handleSaveDcValues} onDiscard={ds.resetDcValues} accentColor="emerald" />
        )}
      </AnimatePresence>

      {/* Chart */}
      <div className="space-y-3">
        <ChartDateRangeToolbar preset={chartRange.preset} rangeLabel={chartRange.rangeLabel} isAtToday={chartRange.isAtToday} interval={chartRange.interval} presetsDisabled={chartRange.presetsDisabled} onPresetChange={chartRange.setPreset} onIntervalChange={chartRange.setInterval} onPrev={chartRange.goToPrev} onNext={chartRange.goToNext} onToday={chartRange.goToToday} />
        <ActiveObjectiveBanner objectives={activeItem.objetive} />
        <DurationChart
          weekDays={ds.weekDays} entries={chartCompatibleEntries} dcConfig={dcConfig}
          chartDays={extendedChartDays} tickInterval={chartRange.tickInterval}
          itemBaselines={activeItem.baseline} itemObjectives={activeItem.objetive}
          gapDateKeys={gapDateKeys} aggregatedData={chartData.aggregatedPoints}
          interval={chartRange.interval} unitLabel={unitLabel}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3.5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{weeklyLabel}</span>
            <span className="text-xl font-bold text-slate-800 tabular-nums leading-tight">
              {ds.weeklyAggregate === 0 ? "—" : (Number.isInteger(ds.weeklyAggregate) ? ds.weeklyAggregate : ds.weeklyAggregate.toFixed(1))}
            </span>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly Average</span>
            <span className="text-xl font-bold tabular-nums leading-tight bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              {ds.monthlyAverage === 0 ? "—" : (Number.isInteger(ds.monthlyAverage) ? ds.monthlyAverage : ds.monthlyAverage.toFixed(1))}
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

      {/* Unit Info */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-700">Unit of time: {unitLabel}</p>
      </div>

      <EnvironmentalChangesLegend entries={ds.entries} />
    </div>
  )
}
