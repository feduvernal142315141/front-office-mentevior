"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays, ChevronLeft, ChevronRight, BarChart3, Hash, FileText,
  Minus, Plus, MapPin, Save, RotateCcw, Loader2, Check, CalendarCheck2,
  CalendarRange,
} from "lucide-react"
import { addDays, format, startOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import { updateBaselineValues } from "@/lib/modules/client-service-plan/services/client-data-collection.service"
import { useClientDataCollectionValues } from "@/lib/modules/client-service-plan/hooks/use-client-data-collection-values"
import { useClientAppointments } from "@/lib/modules/schedules/hooks/use-client-appointments"
import { upsertClientDataCollectionValue } from "@/lib/modules/client-service-plan/services/client-data-collection-values.service"
import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { useFrequencyDatasheet, type RangeMode } from "./useFrequencyDatasheet"
import { useChartDateRange } from "./useChartDateRange"
import { useChartData } from "./useChartData"
import { ChartDateRangeToolbar } from "./ChartDateRangeToolbar"
import { getDateKey, parseLocalDate } from "./frequency-datasheet.types"
import { FrequencyChart } from "./FrequencyChart"

interface FrequencyDatasheetProps {
  clientId: string
  activeItem: ClientServicePlanCategoryMappedItem
  categoryTypeName: string
  dcConfig: DataCollectionConfig | null
}

export function FrequencyDatasheet({ clientId, activeItem, categoryTypeName, dcConfig }: FrequencyDatasheetProps) {
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
      setDcSaveState("success")
      setTimeout(() => setDcSaveState("idle"), 1500)
    } catch {
      setDcSaveState("idle")
    }
  }, [ds, clientAppointments.appointmentsByDate, activeItem.id, dcValues])

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
        onPrev={ds.goToPrev}
        onNext={ds.goToNext}
        onToday={ds.goToToday}
        onChangeMode={ds.changeMode}
        onGoToDate={ds.goToDate}
        onSetRange={ds.setRange}
      />

      {/* ─── Grid ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className={ds.rangeMode === "month" ? "min-w-[1400px]" : "min-w-[1080px]"}>
            {/* Column Headers */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: gridCols }}>
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

// ─── Premium Header ──────────────────────────────────────────────────────────

const MODE_OPTIONS: { value: RangeMode; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
]

function DatasheetHeader({
  rangeMode,
  periodLabel,
  monthYearLabel,
  dateRange,
  staffAvatars,
  staffCount,
  onPrev,
  onNext,
  onToday,
  onChangeMode,
  onGoToDate,
  onSetRange,
}: {
  rangeMode: RangeMode
  periodLabel: string
  monthYearLabel: string
  dateRange: { start: Date; end: Date }
  staffAvatars: string[]
  staffCount: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onChangeMode: (mode: RangeMode) => void
  onGoToDate: (date: Date) => void
  onSetRange: (start: Date, end: Date) => void
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleOpenChange = useCallback((open: boolean) => {
    setCalendarOpen(open)
    if (open) {
      // Small scroll so the popover has room to render fully
      requestAnimationFrame(() => {
        triggerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [])
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)

  // Computed week range from selected day
  const selectedWeekRange = useMemo(() => {
    if (!selectedDay) return null
    const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    return { start: weekStart, end: weekEnd }
  }, [selectedDay])

  const handleCalendarSelect = useCallback(
    (day: Date | undefined) => {
      if (!day) return
      setSelectedDay(day)
    },
    [],
  )

  const handleApplyRange = useCallback(() => {
    if (!selectedDay) return
    onGoToDate(selectedDay)
    onChangeMode("week")
    setCalendarOpen(false)
    setSelectedDay(undefined)
  }, [selectedDay, onGoToDate, onChangeMode])

  const handleQuickMonth = useCallback(
    (date: Date) => {
      onGoToDate(date)
      onChangeMode("month")
      setCalendarOpen(false)
    },
    [onGoToDate, onChangeMode],
  )

  const handleQuickWeek = useCallback(
    (date: Date) => {
      onGoToDate(date)
      onChangeMode("week")
      setCalendarOpen(false)
    },
    [onGoToDate, onChangeMode],
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Top Row: Mode selector + period nav */}
      <div className="flex items-center justify-between px-5 py-3.5">
        {/* Left: Mode pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-xl bg-slate-100/80 p-1">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeMode(opt.value === "custom" ? rangeMode : opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                  rangeMode === opt.value
                    ? "bg-white text-[#037ECC] shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                  opt.value === "custom" && "hidden",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <CalendarDays className="h-4.5 w-4.5 text-[#037ECC]" />
          <span className="text-base font-bold text-slate-800">{monthYearLabel}</span>
        </div>

        {/* Center: Period navigation */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>

          <Popover open={calendarOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button
                ref={triggerRef}
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-1.5 text-sm font-medium transition-all",
                  calendarOpen
                    ? "border-[#037ECC]/40 bg-[#037ECC]/5 text-[#037ECC] shadow-sm ring-2 ring-[#037ECC]/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm"
                )}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span>Period: {periodLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[100]" align="center" sideOffset={8}>
              <div className="p-5 space-y-4">
                {/* Quick actions */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick select</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => handleQuickWeek(new Date())}
                      className="px-3 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC] transition-all">
                      This week
                    </button>
                    <button type="button" onClick={() => handleQuickMonth(new Date())}
                      className="px-3 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC] transition-all">
                      This month
                    </button>
                    <button type="button" onClick={() => {
                      const d = new Date(); d.setMonth(d.getMonth() - 1)
                      handleQuickMonth(d)
                    }}
                      className="px-3 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC] transition-all">
                      Last month
                    </button>
                    <button type="button" onClick={() => {
                      const s = new Date(new Date().getFullYear(), 0, 1)
                      handleQuickWeek(s)
                    }}
                      className="px-3 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC] transition-all">
                      First week of year
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Calendar — select a day to pick its week */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select a week</p>
                  <p className="text-[11px] text-slate-400">Click any day to select its full week (Mon – Sun)</p>
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selectedDay}
                    onSelect={handleCalendarSelect}
                    numberOfMonths={1}
                    fromYear={2020}
                    toYear={2030}
                    modifiers={selectedWeekRange ? { weekHighlight: { from: selectedWeekRange.start, to: selectedWeekRange.end } } : undefined}
                    modifiersClassNames={{ weekHighlight: "!bg-[#037ECC]/10 !text-[#037ECC] !font-semibold" }}
                  />
                </div>

                {/* Apply button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-500">
                    {selectedWeekRange
                      ? `${format(selectedWeekRange.start, "MMM dd")} – ${format(selectedWeekRange.end, "MMM dd, yyyy")}`
                      : "No week selected"}
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyRange}
                    disabled={!selectedDay}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#037ECC] to-[#079CFB] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="h-3 w-3" />
                    Apply
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <button type="button" onClick={onNext}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </button>

          <button type="button" onClick={onToday}
            className="ml-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
            Today
          </button>
        </div>

        {/* Right: Staff avatars */}
        <div className="flex items-center gap-2">
          {staffAvatars.length > 0 && (
            <div className="flex -space-x-1.5">
              {staffAvatars.map((initials) => (
                <div key={initials} className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-[10px] font-bold text-white ring-2 ring-white" title={initials}>
                  {initials}
                </div>
              ))}
            </div>
          )}
          {staffCount > 0 && <span className="text-xs font-medium text-slate-500">{staffCount} Staff Recording</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function NoteButton({ value, onChange, dateLabel }: { value: string; onChange: (v: string) => void; dateLabel: string }) {
  const hasNote = value.trim().length > 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex items-center justify-center rounded-xl border transition-all",
            hasNote
              ? "h-9 w-full border-teal-200 bg-teal-50/80 text-teal-600 hover:border-teal-300 hover:bg-teal-50"
              : "h-9 w-full border-slate-200 bg-slate-50/60 text-slate-400 hover:border-slate-300 hover:bg-white hover:text-slate-500",
          )}
        >
          {hasNote ? (
            <>
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-white" />
            </>
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-white border border-slate-200 shadow-xl rounded-xl z-[100]" align="center" sideOffset={6}>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-xs font-semibold text-slate-700">{dateLabel}</span>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Add environmental note..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all resize-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function RowLabel({ icon, title, badge, badgeColor }: { icon: React.ReactNode; title: string; badge?: string; badgeColor?: "blue" | "teal" }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-r border-slate-100 sticky left-0 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 leading-tight">{title}</p>
        {badge && <span className={cn("text-[10px] font-semibold leading-none mt-0.5 inline-block", badgeColor === "blue" && "text-[#037ECC]", badgeColor === "teal" && "text-teal-500")}>{badge}</span>}
      </div>
    </div>
  )
}

function SaveBar({ label, sublabel, saveLabel, saveState, onSave, onDiscard, accentColor }: {
  label: string; sublabel: string; saveLabel: string; saveState: "idle" | "saving" | "success"; onSave: () => void; onDiscard: () => void; accentColor?: "amber" | "emerald"
}) {
  const color = accentColor ?? "amber"
  const borderColor = color === "emerald" ? "border-emerald-300/70" : "border-amber-300/70"
  const shimmerColor = color === "emerald" ? "via-emerald-400" : "via-amber-400"
  const indicatorBg = color === "emerald" ? "bg-emerald-400/20" : "bg-amber-400/20"
  const indicatorInner = color === "emerald" ? "from-emerald-100 to-emerald-50 border-emerald-200/60" : "from-amber-100 to-amber-50 border-amber-200/60"
  const iconColor = color === "emerald" ? "text-emerald-600" : "text-amber-600"

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="sticky bottom-4 z-30">
      <div className={cn("relative rounded-2xl border bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden", borderColor)}>
        <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent animate-[shimmer_2s_ease-in-out_infinite]", shimmerColor)} />
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className={cn("absolute inset-0 rounded-full animate-ping", indicatorBg)} />
              <div className={cn("relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br border", indicatorInner)}>
                <Save className={cn("h-4 w-4", iconColor)} />
              </div>
            </div>
            <div><p className="text-sm font-semibold text-slate-800">{label}</p><p className="text-xs text-slate-500">{sublabel}</p></div>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onDiscard} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.97]">
              <RotateCcw className="h-3.5 w-3.5" />Discard
            </button>
            <motion.button type="button" onClick={onSave} disabled={saveState === "saving"}
              animate={saveState === "success" ? { scale: 1 } : { scale: [1, 1.03, 1] }}
              transition={saveState === "success" ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={cn("flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-80",
                saveState === "success" ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_4px_14px_rgba(16,185,129,0.4)]" : "bg-gradient-to-r from-[#037ECC] to-[#079CFB] shadow-[0_4px_14px_rgba(3,126,204,0.4)] hover:shadow-[0_6px_20px_rgba(3,126,204,0.5)] hover:brightness-110")}>
              {saveState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveState === "success" ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saveState === "saving" ? "Saving..." : saveState === "success" ? "Saved!" : saveLabel}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function EnvironmentalChangesLegend({ entries }: { entries: Record<string, import("./frequency-datasheet.types").DayEntry> }) {
  const changes = useMemo(() => {
    const result: { dateKey: string; note: string }[] = []
    for (const [dateKey, entry] of Object.entries(entries)) {
      const note = entry.environmentalNote?.trim()
      if (note) result.push({ dateKey, note })
    }
    return result.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [entries])

  if (changes.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-teal-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Environmental Changes</h4>
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-teal-50 border border-teal-200/60 text-[10px] font-bold text-teal-600 tabular-nums">{changes.length}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
        {changes.map(({ dateKey, note }) => {
          const [y, m, d] = dateKey.split("-")
          const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
          return (
            <div key={dateKey} className="flex items-center gap-2 min-w-0">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">{format(dateObj, "MM/dd/yyyy")}</span>
              <span className="text-sm text-slate-500 truncate">{note}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
