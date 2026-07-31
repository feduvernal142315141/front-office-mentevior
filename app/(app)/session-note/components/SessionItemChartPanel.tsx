"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { BarChart3, Loader2, Maximize2, Minimize2, Save, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { AppointmentNoteCategory } from "@/lib/types/appointment-note.types"
import type { CategoryItemFormData } from "../hooks/useSessionNoteForm"
import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { useClientDataCollectionValues } from "@/lib/modules/client-service-plan/hooks/use-client-data-collection-values"
import { upsertClientDataCollectionValue } from "@/lib/modules/client-service-plan/services/client-data-collection-values.service"
import type { ClientServicePlanItemBaseline, ClientServicePlanItemObjective } from "@/lib/types/client-service-plan.types"
import { useChartDateRange, type ChartRangePreset } from "@/app/(app)/clients/[id]/configuration/components/datasheets/useChartDateRange"
import { useChartData } from "@/app/(app)/clients/[id]/configuration/components/datasheets/useChartData"
import { ChartDateRangeToolbar } from "@/app/(app)/clients/[id]/configuration/components/datasheets/ChartDateRangeToolbar"
import { FrequencyChart } from "@/app/(app)/clients/[id]/configuration/components/datasheets/FrequencyChart"
import { ActiveObjectiveBanner } from "@/app/(app)/clients/[id]/configuration/components/datasheets/ActiveObjectiveBanner"
import { EnvironmentalChangesLegend } from "@/app/(app)/clients/[id]/configuration/components/datasheets/shared-datasheet-components"
import { getDateKey, parseLocalDate } from "@/app/(app)/clients/[id]/configuration/components/datasheets/frequency-datasheet.types"
import { computeHiddenDayKeys } from "@/app/(app)/clients/[id]/configuration/components/datasheets/chart-gaps"
import type { WeekEntries } from "@/app/(app)/clients/[id]/configuration/components/datasheets/frequency-datasheet.types"

// ─── Public component ────────────────────────────────────────────────────────

interface SessionItemChartPanelProps {
  category: AppointmentNoteCategory
  categoryItems: Record<string, CategoryItemFormData>
  appointmentDate: string | null
  appointmentId: string | null
  activeItemId?: string
  onActiveItemChange?: (itemId: string) => void
}

export function SessionItemChartPanel({
  category,
  categoryItems,
  appointmentDate,
  appointmentId,
  activeItemId,
  onActiveItemChange,
}: SessionItemChartPanelProps) {
  const items = category.items
  // Use external activeItemId if provided, otherwise internal
  const effectiveItemId = activeItemId && items.some((i) => i.id === activeItemId) ? activeItemId : items[0]?.id ?? ""
  const [isFullscreen, setIsFullscreen] = useState(false)
  const selectedItem = items.find((i) => i.id === effectiveItemId) ?? items[0]

  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isFullscreen])

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isFullscreen])

  if (!selectedItem) return null

  const edited = categoryItems[selectedItem.id]
  const currentValue = edited?.value ?? selectedItem.value
  const currentEnvChange = edited?.environmentalChange ?? selectedItem.environmentalChange ?? ""

  const itemTabs = items.length > 1 ? (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none rounded-xl bg-slate-100/80 p-1">
      {items.map((item) => {
        const hasVal = (categoryItems[item.id]?.value ?? item.value) != null
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onActiveItemChange?.(item.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5",
              item.id === effectiveItemId
                ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/60",
            )}
          >
            {item.name}
            {hasVal && item.id !== effectiveItemId && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        )
      })}
    </div>
  ) : null

  const renderChart = (compact: boolean) => (
    <ItemChartView
      key={selectedItem.id}
      itemId={selectedItem.id}
      currentValue={currentValue}
      currentEnvChange={currentEnvChange}
      appointmentDate={appointmentDate}
      appointmentId={appointmentId}
      itemBaselines={selectedItem.baseline}
      itemObjectives={selectedItem.objetive}
      compact={compact}
    />
  )

  // ─── Fullscreen ───
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 pt-8 pb-4">
          <div className="flex items-center justify-between max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#037ECC]/10">
                <BarChart3 className="h-4 w-4 text-[#037ECC]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">{category.name}</h2>
                <p className="text-xs text-slate-400 truncate">{selectedItem.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
              Exit Fullscreen
            </button>
          </div>
        </div>

        <div className="px-6 pt-10 pb-12 max-w-[1400px] mx-auto space-y-4">
          {itemTabs}
          {renderChart(false)}
        </div>
      </div>
    )
  }

  // ─── Inline (full chart, adapted to the column beside the category card) ───
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden self-start min-w-0">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        <BarChart3 className="h-4 w-4 text-[#037ECC]" />
        <span className="text-sm font-semibold text-slate-800 flex-1 truncate">
          {selectedItem.name}
        </span>
        {currentValue != null && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-[#037ECC] hover:border-[#037ECC]/30 transition-colors"
          title="Expand chart"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {itemTabs}
        {renderChart(true)}
      </div>
    </div>
  )
}

// ─── Shared data hook ────────────────────────────────────────────────────────

function useItemChartData(
  itemId: string,
  currentValue: number | null,
  currentEnvChange: string,
  appointmentDate: string | null,
  chartRange: ReturnType<typeof useChartDateRange>,
  itemBaselines?: ClientServicePlanItemBaseline[],
  itemObjectives?: ClientServicePlanItemObjective[],
) {
  const parsedDateKey = useMemo(() => {
    if (!appointmentDate) return null
    if (/^\d{4}-\d{2}-\d{2}/.test(appointmentDate)) return appointmentDate.slice(0, 10)
    const d = new Date(appointmentDate)
    if (isNaN(d.getTime())) return null
    return format(d, "yyyy-MM-dd")
  }, [appointmentDate])

  const fetchStart = useMemo(() => {
    if (chartRange.chartDays.length === 0) return ""
    return format(chartRange.chartDays[0], "yyyy-MM-dd")
  }, [chartRange.chartDays])

  const fetchEnd = useMemo(() => {
    if (chartRange.chartDays.length === 0) return ""
    return format(chartRange.chartDays[chartRange.chartDays.length - 1], "yyyy-MM-dd")
  }, [chartRange.chartDays])

  const dcValues = useClientDataCollectionValues({
    clientServicePlanCategoryItemId: itemId,
    startDate: fetchStart,
    endDate: fetchEnd,
  })

  // Build entries: baselines + DC records + live session value
  const entries = useMemo<WeekEntries>(() => {
    const result: WeekEntries = {}

    // Add baseline values as entries
    if (itemBaselines) {
      for (const bl of itemBaselines) {
        if (!bl.show || !bl.date || bl.value <= 0) continue
        const dateKey = bl.date.slice(0, 10)
        result[dateKey] = { occurrences: bl.value, initials: "", environmentalNote: bl.environmentalChanges ?? "" }
      }
    }

    // Add DC records (overwrite baseline if same date)
    for (const rec of dcValues.records) {
      const dateKey = rec.date.slice(0, 10)
      result[dateKey] = { occurrences: rec.value, initials: "", environmentalNote: rec.environmentalChange ?? "" }
    }

    // Overlay live session value
    if (parsedDateKey && currentValue != null) {
      result[parsedDateKey] = { occurrences: currentValue, initials: "", environmentalNote: currentEnvChange }
    }
    return result
  }, [dcValues.records, parsedDateKey, currentValue, currentEnvChange, itemBaselines])

  // Dates whose value comes from data collection: saved DC records + the value being typed now.
  // They must render as treatment even if the date also has a baseline or no STO started yet.
  const collectedDateKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const rec of dcValues.records) keys.add(rec.date.slice(0, 10))
    if (parsedDateKey && currentValue != null) keys.add(parsedDateKey)
    return keys
  }, [dcValues.records, parsedDateKey, currentValue])

  const chartData = useChartData({
    clientServicePlanCategoryItemId: itemId,
    chartDays: chartRange.chartDays,
    interval: chartRange.interval,
    aggregationMethod: ServicePlanValueType.TOTAL,
    baselines: itemBaselines,
    objectives: itemObjectives,
    gridEntries: entries,
    collectedDateKeys,
  })

  // Days the chart must skip: every empty day (baseline dates and phase markers survive)
  const hiddenDayKeys = useMemo(
    () => computeHiddenDayKeys({
      chartDays: chartRange.chartDays,
      hasData: (key) => (entries[key]?.occurrences ?? 0) > 0,
      baselines: itemBaselines,
      objectives: itemObjectives,
    }),
    [chartRange.chartDays, entries, itemBaselines, itemObjectives],
  )

  // Check if current form value differs from the saved API value for this date
  const hasPendingChanges = useMemo(() => {
    if (parsedDateKey == null || currentValue == null) return false
    const savedRec = dcValues.records.find((r) => r.date.slice(0, 10) === parsedDateKey)
    if (!savedRec) return true
    if (savedRec.value !== currentValue) return true
    const savedEnv = (savedRec.environmentalChange ?? "").trim()
    const liveEnv = currentEnvChange.trim()
    if (savedEnv !== liveEnv) return true
    return false
  }, [dcValues.records, parsedDateKey, currentValue, currentEnvChange])

  return { entries, chartData, hiddenDayKeys, collectedDateKeys, isLoading: dcValues.isLoading, parsedDateKey, refetch: dcValues.refetch, hasPendingChanges }
}

// ─── Range stats (mirrors the Data Collection datasheet footer) ───────────────

function useRangeStats(entries: WeekEntries, chartDays: Date[], preset: ChartRangePreset) {
  return useMemo(() => {
    let rangeTotal = 0
    let eventsLogged = 0
    for (const day of chartDays) {
      const entry = entries[getDateKey(day)]
      if (!entry) continue
      rangeTotal += entry.occurrences ?? 0
      if ((entry.environmentalNote ?? "").trim().length > 0) eventsLogged++
    }

    // Monthly average over the month of the last visible day
    const anchor = chartDays[chartDays.length - 1] ?? new Date()
    const monthDays = eachDayOfInterval({ start: startOfMonth(anchor), end: endOfMonth(anchor) })
    let monthTotal = 0
    let daysWithData = 0
    for (const day of monthDays) {
      const entry = entries[getDateKey(day)]
      if (entry && entry.occurrences > 0) {
        monthTotal += entry.occurrences
        daysWithData++
      }
    }

    return {
      rangeTotal,
      eventsLogged,
      monthlyAverage: daysWithData > 0 ? monthTotal / daysWithData : 0,
      totalLabel: preset === "1W" || preset === "2W" ? "Weekly Total" : "Monthly Total",
    }
  }, [entries, chartDays, preset])
}

// ─── Chart view (full — toolbar + objective banner + chart + stats + env changes) ─

function ItemChartView({
  itemId,
  currentValue,
  currentEnvChange,
  appointmentDate,
  appointmentId,
  itemBaselines,
  itemObjectives,
  compact,
}: {
  itemId: string
  currentValue: number | null
  currentEnvChange: string
  appointmentDate: string | null
  appointmentId: string | null
  itemBaselines?: ClientServicePlanItemBaseline[]
  itemObjectives?: ClientServicePlanItemObjective[]
  compact: boolean
}) {
  // The session day anchors the calendar window, so the value being collected now always
  // falls inside the chart instead of outside the window.
  const sessionDate = useMemo(() => {
    if (!appointmentDate) return undefined
    const parsed = /^\d{4}-\d{2}-\d{2}/.test(appointmentDate)
      ? parseLocalDate(appointmentDate.slice(0, 10))
      : new Date(appointmentDate)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [appointmentDate])

  const chartRange = useChartDateRange("2W", sessionDate)
  const { entries, chartData, hiddenDayKeys, collectedDateKeys, isLoading, parsedDateKey, refetch, hasPendingChanges } = useItemChartData(
    itemId, currentValue, currentEnvChange, appointmentDate, chartRange, itemBaselines, itemObjectives,
  )

  const stats = useRangeStats(entries, chartRange.chartDays, chartRange.preset)

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  // Reset save state when pending changes reappear (user edits again after save)
  useEffect(() => {
    if (hasPendingChanges && saveState === "saved") setSaveState("idle")
  }, [hasPendingChanges, saveState])

  const handleSave = useCallback(async () => {
    if (!parsedDateKey || currentValue == null) return
    setSaveState("saving")
    try {
      await upsertClientDataCollectionValue({
        clientServicePlanCategoryItemId: itemId,
        appointmentId: appointmentId ?? null,
        date: parsedDateKey,
        value: currentValue,
        environmentalChange: currentEnvChange.trim() || null,
      })
      await refetch()
      setSaveState("saved")
      toast.success("Data collection value saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("idle")
      toast.error("Failed to save value")
    }
  }, [itemId, appointmentId, parsedDateKey, currentValue, currentEnvChange, refetch])

  return (
    <div className="space-y-3">
      <ChartDateRangeToolbar
        preset={chartRange.preset}
        rangeLabel={chartRange.rangeLabel}
        isAtToday={chartRange.isAtToday}
        interval={chartRange.interval}
        presetsDisabled={chartRange.presetsDisabled}
        onPresetChange={chartRange.setPreset}
        onIntervalChange={chartRange.setInterval}
        onPrev={chartRange.goToPrev}
        onNext={chartRange.goToNext}
        onToday={chartRange.goToToday}
        compact={compact}
      />

      <ActiveObjectiveBanner objectives={itemObjectives} />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 text-[#037ECC] animate-spin" />
        </div>
      ) : (
        <FrequencyChart
          weekDays={[]}
          entries={entries}
          dcConfig={null}
          chartDays={chartRange.chartDays}
          gapDateKeys={hiddenDayKeys}
          collectedDateKeys={collectedDateKeys}
          tickInterval={chartRange.tickInterval}
          aggregatedData={chartData.aggregatedPoints}
          interval={chartRange.interval}
          itemBaselines={itemBaselines}
          itemObjectives={itemObjectives}
          compact={compact}
        />
      )}

      {/* Stats footer */}
      <div className={cn(
        "flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm",
        compact ? "flex-wrap gap-y-2 px-4 py-3" : "px-5 py-3.5",
      )}>
        <div className={cn("flex items-center", compact ? "gap-4" : "gap-6")}>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{stats.totalLabel}</span>
            <span className="text-xl font-bold text-slate-800 tabular-nums leading-tight">{stats.rangeTotal}</span>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly Average</span>
            <span className="text-xl font-bold tabular-nums leading-tight bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              {stats.monthlyAverage === 0 ? "—" : stats.monthlyAverage.toFixed(1)}
            </span>
          </div>
        </div>
        {stats.eventsLogged > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 border border-teal-200/60">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-600">
              {stats.eventsLogged} event{stats.eventsLogged !== 1 ? "s" : ""} logged
            </span>
          </div>
        )}
      </div>

      <EnvironmentalChangesLegend entries={entries} compact={compact} />

      {/* Save bar */}
      {hasPendingChanges && (
        <div className="rounded-2xl border border-[#037ECC]/20 bg-gradient-to-r from-[#037ECC]/[0.04] to-[#079CFB]/[0.04] shadow-[0_2px_12px_rgba(3,126,204,0.06)] relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#037ECC] to-[#079CFB]" />
          <div className={cn(
            "flex items-center justify-between",
            compact ? "flex-wrap gap-2 px-4 py-2.5" : "px-5 py-3",
          )}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 animate-ping" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#037ECC]/20 to-[#079CFB]/20 border border-[#037ECC]/30">
                  <Save className="h-3.5 w-3.5 text-[#037ECC]" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Unsaved chart data</p>
                <p className="text-xs text-slate-500">
                  Value: <span className="font-semibold text-[#037ECC]">{currentValue}</span> on {parsedDateKey}
                  {currentEnvChange && <span className="ml-1.5 text-teal-500">+ env. change</span>}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-80 bg-gradient-to-r from-[#037ECC] to-[#079CFB] shadow-[0_4px_14px_rgba(3,126,204,0.4)] hover:shadow-[0_6px_20px_rgba(3,126,204,0.5)] hover:brightness-110"
            >
              {saveState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saveState === "saving" ? "Saving..." : "Save to Chart"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
