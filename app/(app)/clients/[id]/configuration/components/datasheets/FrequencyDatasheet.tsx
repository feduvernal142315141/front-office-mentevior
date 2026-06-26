"use client"

import { useCallback, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, BarChart3, Hash, FileText, Minus, Plus, MapPin, Save, RotateCcw, Loader2, Check } from "lucide-react"
import { addDays, format } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { FloatingInput } from "@/components/custom/FloatingInput"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import { updateBaselineValues } from "@/lib/modules/client-service-plan/services/client-data-collection.service"
import { useFrequencyDatasheet } from "./useFrequencyDatasheet"
import { useChartDateRange } from "./useChartDateRange"
import { ChartDateRangeToolbar } from "./ChartDateRangeToolbar"
import { getDateKey, parseLocalDate } from "./frequency-datasheet.types"
import { FrequencyChart } from "./FrequencyChart"

interface FrequencyDatasheetProps {
  activeItem: ClientServicePlanCategoryMappedItem
  categoryTypeName: string
  dcConfig: DataCollectionConfig | null
}

export function FrequencyDatasheet({ activeItem, categoryTypeName, dcConfig }: FrequencyDatasheetProps) {
  const ds = useFrequencyDatasheet(activeItem.baseline)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success">("idle")

  const handleSaveBaseline = useCallback(async () => {
    const changed = ds.getChangedBaselines()
    if (changed.length === 0) return
    setSaveState("saving")
    try {
      await updateBaselineValues(changed)
      ds.commitBaseline()
      setSaveState("success")
      setTimeout(() => setSaveState("idle"), 1500)
    } catch {
      setSaveState("idle")
    }
  }, [ds])

  // First baseline date as anchor for the chart range
  const firstBaselineDate = useMemo(() => {
    const bls = activeItem.baseline
    if (!bls || bls.length === 0) return undefined
    const sorted = [...bls]
      .filter((b) => b.date)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    return sorted.length > 0 ? parseLocalDate(sorted[0].date) : undefined
  }, [activeItem.baseline])

  // Gap dates: days strictly between last baseline and first STO start — must be hidden
  const gapDateKeys = useMemo(() => {
    const bls = activeItem.baseline
    const objs = activeItem.objetive
    if (!bls || bls.length === 0 || !objs || objs.length === 0) return new Set<string>()

    const baselineTimes = bls.filter((b) => b.date).map((b) => parseLocalDate(b.date).getTime())
    const stoTimes = objs.filter((o) => o.startDate).map((o) => parseLocalDate(o.startDate).getTime())
    if (baselineTimes.length === 0 || stoTimes.length === 0) return new Set<string>()

    const lastBaselineTime = Math.max(...baselineTimes)
    const firstStoTime = Math.min(...stoTimes)

    if (lastBaselineTime >= firstStoTime) return new Set<string>()

    const keys = new Set<string>()
    const cursor = new Date(lastBaselineTime)
    cursor.setDate(cursor.getDate() + 1)
    while (cursor.getTime() < firstStoTime) {
      keys.add(getDateKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return keys
  }, [activeItem.baseline, activeItem.objetive])

  const chartRange = useChartDateRange("1W", firstBaselineDate)

  // Visible days in the grid: exclude gap dates, then extend at the end to keep 7
  const visibleDays = useMemo(() => {
    const filtered = ds.weekDays.filter((day) => !gapDateKeys.has(getDateKey(day)))
    const needed = 7 - filtered.length
    if (needed <= 0) return filtered

    // Add extra days after the last weekDay
    const lastWeekDay = ds.weekDays[ds.weekDays.length - 1]
    const extended = [...filtered]
    let cursor = lastWeekDay
    while (extended.length < 7) {
      cursor = addDays(cursor, 1)
      const key = getDateKey(cursor)
      if (!gapDateKeys.has(key)) {
        extended.push(cursor)
      }
    }
    return extended
  }, [ds.weekDays, gapDateKeys])

  // Extend chart days to compensate for hidden gap days
  const extendedChartDays = useMemo(() => {
    const original = chartRange.chartDays
    const gapCount = original.filter((day) => gapDateKeys.has(getDateKey(day))).length
    if (gapCount === 0) return original

    const lastDay = original[original.length - 1]
    const extended = [...original]
    let cursor = lastDay
    let added = 0
    while (added < gapCount) {
      cursor = addDays(cursor, 1)
      extended.push(cursor)
      added++
    }
    return extended
  }, [chartRange.chartDays, gapDateKeys])

  const gridCols = `200px repeat(${visibleDays.length}, minmax(120px, 1fr))`

  return (
    <div className="space-y-4">
      {/* Header */}
      <DatasheetHeader
        monthYearLabel={ds.monthYearLabel}
        periodLabel={ds.periodLabel}
        staffAvatars={ds.staffAvatars}
        staffCount={ds.staffCount}
        onPrev={ds.goToPrevWeek}
        onNext={ds.goToNextWeek}
        onToday={ds.goToCurrentWeek}
      />

      {/* Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
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
                return (
                  <div key={key} className={cn(
                    "flex items-center justify-center py-3",
                    isBaseline && "bg-red-50/60",
                    today && !isBaseline && "bg-[#037ECC]/[0.03]",
                  )}>
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center w-14 h-14 rounded-full",
                        today
                          ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white shadow-md ring-2 ring-[#037ECC]/20 ring-offset-2"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      <span className="text-lg font-bold leading-none">{format(day, "dd")}</span>
                      <span className={cn("text-[10px] font-semibold uppercase leading-none mt-0.5", today ? "text-white/80" : "text-slate-400")}>
                        {format(day, "MMM")}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Row: Number of Occurrences */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel
                icon={<BarChart3 className="h-4 w-4 text-[#037ECC]" />}
                title="Number of occurrences"
                badge="Mandatory Field"
                badgeColor="blue"
              />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                return (
                  <div key={key} className={cn(
                    "flex items-center justify-center px-2 py-3",
                    isBaseline && "bg-red-50/60",
                    today && !isBaseline && "bg-[#037ECC]/[0.03]",
                  )}>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                      <button
                        type="button"
                        onClick={() => ds.decrementOccurrences(key)}
                        disabled={entry.occurrences === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={entry.occurrences || ""}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "")
                          ds.setOccurrences(key, v === "" ? 0 : parseInt(v, 10))
                        }}
                        className="h-8 w-10 rounded-lg bg-white border border-slate-200 text-center text-sm font-semibold text-slate-800 tabular-nums outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => ds.incrementOccurrences(key)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#037ECC]"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Row: Occurrence Marks */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel
                icon={<Hash className="h-4 w-4 text-slate-400" />}
                title="Occurrences"
              />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                const count = entry.occurrences || 0
                return (
                  <div key={key} className={cn(
                    "px-2 py-3",
                    isBaseline && "bg-red-50/60",
                    today && !isBaseline && "bg-[#037ECC]/[0.03]",
                  )}>
                    {count > 0 ? (
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: count }, (_, i) => (
                          <div
                            key={i}
                            className="h-7 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-400 flex items-center justify-center"
                          >
                            X
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-7">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Row: Environmental Changes */}
            <div className="grid" style={{ gridTemplateColumns: gridCols }}>
              <RowLabel
                icon={<FileText className="h-4 w-4 text-teal-500" />}
                title="Environmental changes"
                badge="Affects Chart Phase Lines"
                badgeColor="teal"
              />
              {visibleDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const hasNote = entry.environmentalNote.trim().length > 0
                const today = ds.isToday(day)
                const isBaseline = ds.isBaselineDate(key)
                return (
                  <div key={key} className={cn(
                    "flex items-center justify-center px-3 py-3",
                    isBaseline && "bg-red-50/60",
                    today && !isBaseline && "bg-[#037ECC]/[0.03]",
                  )}>
                    <FloatingInput
                      label="Add note..."
                      value={entry.environmentalNote}
                      onChange={(v) => ds.setNote(key, v)}
                      onBlur={() => {}}
                      isSuccess={hasNote}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Baseline Save Bar — sticky bottom with entrance animation */}
      <AnimatePresence>
        {ds.hasBaselineChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="sticky bottom-4 z-30"
          >
            <div className="relative rounded-2xl border border-amber-300/70 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
              {/* Animated shimmer top border */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />

              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {/* Pulsing indicator */}
                  <div className="relative flex h-9 w-9 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/60">
                      <Save className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Unsaved baseline changes</p>
                    <p className="text-xs text-slate-500">You have modified baseline values</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={ds.resetBaseline}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.97]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Discard
                  </button>
                  <motion.button
                    type="button"
                    onClick={handleSaveBaseline}
                    disabled={saveState === "saving"}
                    animate={saveState === "success" ? { scale: 1 } : { scale: [1, 1.03, 1] }}
                    transition={saveState === "success" ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-80",
                      saveState === "success"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_4px_14px_rgba(16,185,129,0.4)]"
                        : "bg-gradient-to-r from-[#037ECC] to-[#079CFB] shadow-[0_4px_14px_rgba(3,126,204,0.4)] hover:shadow-[0_6px_20px_rgba(3,126,204,0.5)] hover:brightness-110",
                    )}
                  >
                    {saveState === "saving" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : saveState === "success" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {saveState === "saving" ? "Saving..." : saveState === "success" ? "Saved!" : "Save Baseline"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart */}
      <div className="space-y-3">
        <ChartDateRangeToolbar
          preset={chartRange.preset}
          rangeLabel={chartRange.rangeLabel}
          isAtToday={chartRange.isAtToday}
          onPresetChange={chartRange.setPreset}
          onPrev={chartRange.goToPrev}
          onNext={chartRange.goToNext}
          onToday={chartRange.goToToday}
        />
        <FrequencyChart
          weekDays={ds.weekDays}
          entries={ds.entries}
          dcConfig={dcConfig}
          chartDays={extendedChartDays}
          tickInterval={chartRange.tickInterval}
          itemBaselines={activeItem.baseline}
          itemObjectives={activeItem.objetive}
          gapDateKeys={gapDateKeys}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3.5">
        <div className="flex items-center gap-6">
          {/* Weekly Total */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Weekly Total</span>
              <span className="text-xl font-bold text-slate-800 tabular-nums leading-tight">{ds.weeklyTotal}</span>
            </div>
          </div>

          <div className="h-9 w-px bg-slate-200" />

          {/* Monthly Average */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly Average</span>
              <span className="text-xl font-bold tabular-nums leading-tight bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                {ds.monthlyAverage === 0 ? "—" : ds.monthlyAverage.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {ds.eventsLoggedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 border border-teal-200/60">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-600">
              {ds.eventsLoggedCount} event{ds.eventsLoggedCount !== 1 ? "s" : ""} logged
            </span>
          </div>
        )}
      </div>

      {/* Environmental Changes Legend (print-friendly) */}
      <EnvironmentalChangesLegend entries={ds.entries} />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DatasheetHeader({
  monthYearLabel,
  periodLabel,
  staffAvatars,
  staffCount,
  onPrev,
  onNext,
  onToday,
}: {
  monthYearLabel: string
  periodLabel: string
  staffAvatars: string[]
  staffCount: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3.5">
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <CalendarDays className="h-5 w-5 text-[#037ECC]" />
        <span className="text-base font-bold text-slate-800">{monthYearLabel}</span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-slate-600 px-1">
          Period: {periodLabel}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm"
        >
          Today
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {staffAvatars.length > 0 && (
          <div className="flex -space-x-1.5">
            {staffAvatars.map((initials) => (
              <div
                key={initials}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-[10px] font-bold text-white ring-2 ring-white"
                title={initials}
              >
                {initials}
              </div>
            ))}
          </div>
        )}
        {staffCount > 0 && (
          <span className="text-xs font-medium text-slate-500">
            {staffCount} Staff Recording
          </span>
        )}
      </div>
    </div>
  )
}

function RowLabel({
  icon,
  title,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode
  title: string
  badge?: string
  badgeColor?: "blue" | "teal"
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-r border-slate-100 sticky left-0 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 leading-tight">{title}</p>
        {badge && (
          <span
            className={cn(
              "text-[10px] font-semibold leading-none mt-0.5 inline-block",
              badgeColor === "blue" && "text-[#037ECC]",
              badgeColor === "teal" && "text-teal-500"
            )}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

function EnvironmentalChangesLegend({ entries }: { entries: Record<string, import("./frequency-datasheet.types").DayEntry> }) {
  const changes = useMemo(() => {
    const result: { dateKey: string; note: string }[] = []
    for (const [dateKey, entry] of Object.entries(entries)) {
      const note = entry.environmentalNote?.trim()
      if (note) {
        result.push({ dateKey, note })
      }
    }
    return result.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [entries])

  if (changes.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-teal-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Environmental Changes
        </h4>
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-teal-50 border border-teal-200/60 text-[10px] font-bold text-teal-600 tabular-nums">
          {changes.length}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
        {changes.map(({ dateKey, note }) => {
          const [y, m, d] = dateKey.split("-")
          const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
          return (
            <div key={dateKey} className="flex items-center gap-2 min-w-0">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">
                {format(dateObj, "MM/dd/yyyy")}
              </span>
              <span className="text-sm text-slate-500 truncate">{note}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
