"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { BarChart3, Loader2, Maximize2, Minimize2, Save, Check } from "lucide-react"
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { AppointmentNoteCategory } from "@/lib/types/appointment-note.types"
import type { CategoryItemFormData } from "../hooks/useSessionNoteForm"
import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { useClientDataCollectionValues } from "@/lib/modules/client-service-plan/hooks/use-client-data-collection-values"
import { upsertClientDataCollectionValue } from "@/lib/modules/client-service-plan/services/client-data-collection-values.service"
import type { ClientServicePlanItemBaseline, ClientServicePlanItemObjective } from "@/lib/types/client-service-plan.types"
import { useChartDateRange } from "@/app/(app)/clients/[id]/configuration/components/datasheets/useChartDateRange"
import { useChartData } from "@/app/(app)/clients/[id]/configuration/components/datasheets/useChartData"
import { ChartDateRangeToolbar } from "@/app/(app)/clients/[id]/configuration/components/datasheets/ChartDateRangeToolbar"
import { FrequencyChart } from "@/app/(app)/clients/[id]/configuration/components/datasheets/FrequencyChart"
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

  return (
    <>
      {/* ─── Compact View ─── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden self-start">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
          <BarChart3 className="h-3.5 w-3.5 text-[#037ECC]" />
          <span className="text-xs font-semibold text-slate-600 flex-1 truncate">
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
            className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-[#037ECC] hover:border-[#037ECC]/30 transition-colors"
            title="Expand chart"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <ItemChartView
          itemId={selectedItem.id}
          currentValue={currentValue}
          currentEnvChange={currentEnvChange}
          appointmentDate={appointmentDate}
          appointmentId={appointmentId}
          itemBaselines={selectedItem.baseline}
          itemObjectives={selectedItem.objetive}
          compact
        />

        {items.length > 1 && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-t border-slate-100 overflow-x-auto scrollbar-none">
            {items.map((item) => {
              const hasVal = (categoryItems[item.id]?.value ?? item.value) != null
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onActiveItemChange?.(item.id)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1",
                    item.id === effectiveItemId
                      ? "bg-[#037ECC]/10 text-[#037ECC]"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {item.name.length > 16 ? item.name.slice(0, 16) + "…" : item.name}
                  {hasVal && item.id !== effectiveItemId && (
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Fullscreen ─── */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3">
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

          <div className="px-6 py-6 max-w-[1400px] mx-auto space-y-4">
            {items.length > 1 && (
              <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 overflow-x-auto">
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
            )}

            <ItemChartView
              key={selectedItem.id}
              itemId={selectedItem.id}
              currentValue={currentValue}
              currentEnvChange={currentEnvChange}
              appointmentDate={appointmentDate}
              appointmentId={appointmentId}
              itemBaselines={selectedItem.baseline}
              itemObjectives={selectedItem.objetive}
              compact={false}
            />
          </div>
        </div>
      )}
    </>
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

  // Filter chartDays to only include days that have data
  const filteredChartDays = useMemo(() => {
    return chartRange.chartDays.filter((day) => {
      const key = format(day, "yyyy-MM-dd")
      return entries[key] !== undefined
    })
  }, [chartRange.chartDays, entries])

  const chartData = useChartData({
    clientServicePlanCategoryItemId: itemId,
    chartDays: filteredChartDays,
    interval: chartRange.interval,
    aggregationMethod: ServicePlanValueType.TOTAL,
    gridEntries: entries,
  })

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

  return { entries, chartData, filteredChartDays, isLoading: dcValues.isLoading, parsedDateKey, refetch: dcValues.refetch, hasPendingChanges }
}

// ─── Chart view (compact + full) ─────────────────────────────────────────────

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
  // Anchor chart from first baseline date so it covers baseline → today
  const firstBaselineDate = useMemo(() => {
    if (!itemBaselines || itemBaselines.length === 0) return undefined
    const sorted = [...itemBaselines]
      .filter((b) => b.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sorted.length > 0 ? new Date(sorted[0].date) : undefined
  }, [itemBaselines])

  const chartRange = useChartDateRange("2W", firstBaselineDate)
  const { entries, chartData, filteredChartDays, isLoading, parsedDateKey, refetch, hasPendingChanges } = useItemChartData(
    itemId, currentValue, currentEnvChange, appointmentDate, chartRange, itemBaselines,
  )

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  // Reset save state when pending changes reappear (user edits again after save)
  useEffect(() => {
    if (hasPendingChanges && saveState === "saved") setSaveState("idle")
  }, [hasPendingChanges, saveState])

  const showSaveButton = hasPendingChanges

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

  // ─── Compact mode: mini line chart + save button ───
  if (compact) {
    // Determine treatment start from first objective
    const treatmentStart = useMemo(() => {
      if (!itemObjectives || itemObjectives.length === 0) return null
      const sorted = [...itemObjectives].filter((o) => o.startDate).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      return sorted.length > 0 ? new Date(sorted[0].startDate) : null
    }, [itemObjectives])

    // Only show days that have data (baseline or DC values or live value)
    const miniData = useMemo(() => {
      const result: { date: string; baseline: number | null; treatment: number | null }[] = []

      // Add baseline points
      if (itemBaselines) {
        for (const bl of itemBaselines) {
          if (!bl.show || !bl.date) continue
          const d = new Date(bl.date)
          result.push({ date: format(d, "MM/dd"), baseline: bl.value, treatment: null })
        }
      }

      // Add DC value points (from entries) — only days with data
      for (const day of chartRange.chartDays) {
        const key = format(day, "yyyy-MM-dd")
        const entry = entries[key]
        if (!entry || entry.occurrences === 0) continue

        // Check if this date already exists as a baseline point
        const dateLabel = format(day, "MM/dd")
        const existing = result.find((r) => r.date === dateLabel)

        const isBeforeTreatment = treatmentStart ? day.getTime() < treatmentStart.getTime() : false
        if (existing) {
          // Merge — if before treatment it's baseline, otherwise treatment
          if (isBeforeTreatment) existing.baseline = entry.occurrences
          else existing.treatment = entry.occurrences
        } else {
          result.push({
            date: dateLabel,
            baseline: isBeforeTreatment ? entry.occurrences : null,
            treatment: isBeforeTreatment ? null : entry.occurrences,
          })
        }
      }

      return result
    }, [chartRange.chartDays, entries, itemBaselines, treatmentStart])

    const hasData = miniData.length > 0

    return (
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center h-[120px]">
            <Loader2 className="h-4 w-4 text-[#037ECC] animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-[120px] px-4">
            <BarChart3 className="h-5 w-5 text-slate-200 mb-1.5" />
            <p className="text-[11px] text-slate-300">No data yet</p>
          </div>
        ) : (
          <div className="px-2 py-1">
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={miniData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 95%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "#CBD5E1" }} axisLine={false} tickLine={false} width={30} />
                <Line type="monotone" dataKey="baseline" stroke="#DC2626" strokeWidth={2} dot={{ r: 2.5, fill: "white", stroke: "#DC2626", strokeWidth: 1.5 }} connectNulls />
                <Line type="monotone" dataKey="treatment" stroke="#037ECC" strokeWidth={2} dot={{ r: 2.5, fill: "white", stroke: "#037ECC", strokeWidth: 1.5 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Compact save button */}
        {showSaveButton && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#037ECC]/10 bg-[#037ECC]/[0.02]">
            <p className="text-[10px] text-slate-500">
              <span className="font-semibold text-[#037ECC]">{currentValue}</span> on {parsedDateKey}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="flex items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-semibold text-white transition-all bg-gradient-to-r from-[#037ECC] to-[#079CFB] hover:brightness-110 disabled:opacity-70"
            >
              {saveState === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {saveState === "saving" ? "Saving..." : "Save to Chart"}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Full mode: FrequencyChart + toolbar + save bar ───
  return (
    <div className="space-y-2">
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
      />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 text-[#037ECC] animate-spin" />
        </div>
      ) : (
        <FrequencyChart
          weekDays={[]}
          entries={entries}
          dcConfig={null}
          chartDays={filteredChartDays}
          tickInterval={chartRange.tickInterval}
          aggregatedData={chartData.aggregatedPoints}
          interval={chartRange.interval}
          itemBaselines={itemBaselines}
          itemObjectives={itemObjectives}
        />
      )}

      {/* Save bar */}
      {showSaveButton && (
        <div className="rounded-2xl border border-[#037ECC]/20 bg-gradient-to-r from-[#037ECC]/[0.04] to-[#079CFB]/[0.04] shadow-[0_2px_12px_rgba(3,126,204,0.06)] relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#037ECC] to-[#079CFB]" />
          <div className="flex items-center justify-between px-5 py-3">
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
