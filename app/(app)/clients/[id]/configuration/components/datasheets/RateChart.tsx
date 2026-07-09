"use client"

import { useMemo } from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts"
import { format } from "date-fns"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import type { ClientServicePlanItemBaseline, ClientServicePlanItemObjective } from "@/lib/types/client-service-plan.types"
import type { ChartDatasetVisualConfig } from "@/lib/modules/service-plans/constants/chart.constants"
import { ChartInterval, DEFAULT_CHART_CONFIG } from "@/lib/modules/service-plans/constants/chart.constants"
import { ServicePlanUnitOfTime } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import type { Appointment } from "@/lib/types/appointment.types"
import type { DayEntry } from "./frequency-datasheet.types"
import { getDateKey, parseLocalDate } from "./frequency-datasheet.types"
import { dateToPeriodLabel, type AggregatedDataPoint } from "./aggregate-chart-data"
import { getSessionDurationInUnit, unitOfTimeLabel } from "./rate-datasheet.types"

interface RateChartProps {
  weekDays: Date[]
  entries: Record<string, DayEntry>
  dcConfig: DataCollectionConfig | null
  chartDays?: Date[]
  tickInterval?: number
  itemBaselines?: ClientServicePlanItemBaseline[]
  itemObjectives?: ClientServicePlanItemObjective[]
  gapDateKeys?: Set<string>
  aggregatedData?: AggregatedDataPoint[]
  interval?: ChartInterval
  appointmentsByDate: Map<string, Appointment>
  unitOfTime: ServicePlanUnitOfTime
}

interface RateChartDataPoint {
  dateKey: string
  dateLabel: string
  fullDate: string
  rate: number | null
  baselineValue: number | null
  hasNote: boolean
  note: string
  isBaseline?: boolean
  occurrences?: number | null
  duration?: number | null
  aggregatedCount?: number
}

export function RateChart({
  weekDays, entries, dcConfig, chartDays, tickInterval = 0,
  itemBaselines, itemObjectives, gapDateKeys,
  aggregatedData, interval = ChartInterval.DAILY,
  appointmentsByDate, unitOfTime,
}: RateChartProps) {
  const days = chartDays ?? weekDays
  const labelFormat = "MM/dd/yyyy"
  const chartConfig = dcConfig?.chart ?? DEFAULT_CHART_CONFIG
  const objectives = dcConfig?.objectives ?? []
  const isAggregated = interval !== ChartInterval.DAILY && interval !== ChartInterval.SESSION && !!aggregatedData
  const unitLabel = unitOfTimeLabel(unitOfTime)

  // ─── Phase markers ─────────────────────────────────────────────────────

  const treatmentDateLabel = useMemo(() => {
    const objs = itemObjectives ?? []
    if (objs.length === 0) return null
    const sorted = [...objs]
      .filter((o) => o.startDate)
      .sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
    if (sorted.length === 0) return null
    const date = parseLocalDate(sorted[0].startDate)
    return isAggregated ? dateToPeriodLabel(date, interval) : format(date, labelFormat)
  }, [itemObjectives, isAggregated, interval])

  const stoPhases = useMemo(() => {
    const objs = itemObjectives ?? []
    if (objs.length === 0) return []
    const sorted = [...objs]
      .filter((o) => o.startDate)
      .sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
    return sorted.map((obj, idx) => {
      const startDate = parseLocalDate(obj.startDate)
      const endDate = obj.endDate ? parseLocalDate(obj.endDate) : null
      return {
        number: idx + 1,
        startLabel: isAggregated ? dateToPeriodLabel(startDate, interval) : format(startDate, labelFormat),
        endLabel: endDate ? (isAggregated ? dateToPeriodLabel(endDate, interval) : format(endDate, labelFormat)) : null,
      }
    })
  }, [itemObjectives, isAggregated, interval])

  // ─── Baselines ─────────────────────────────────────────────────────────

  const baselines = useMemo(() => {
    if (itemBaselines && itemBaselines.length > 0) {
      return itemBaselines.map((b) => ({
        date: b.date, value: b.value, show: b.show,
        comments: b.environmentalChanges ?? "", periodCatalogId: b.periodCatalogId,
      }))
    }
    return dcConfig?.baselines ?? []
  }, [itemBaselines, dcConfig?.baselines])

  // ─── Build chart data points with RATE calculation ─────────────────────

  const data = useMemo<RateChartDataPoint[]>(() => {
    if (isAggregated && aggregatedData) {
      // For aggregated mode, rate is already the value (saved as rate from save)
      // But since we save occurrences, aggregated data shows occurrence totals.
      // We can't calculate rate for aggregated periods easily, so show as-is.
      return aggregatedData.map((ap) => ({
        dateKey: ap.periodKey,
        dateLabel: ap.periodLabel,
        fullDate: ap.periodLabel,
        rate: ap.value,
        baselineValue: ap.baselineValue,
        hasNote: ap.hasNote,
        note: "",
        isBaseline: ap.isBaseline,
        aggregatedCount: ap.count,
      }))
    }

    // DAILY MODE: calculate rate per day
    const visibleBaselines = baselines
      .filter((b) => b.show && b.value > 0 && b.date)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())

    const baselineDateKeys = new Set(visibleBaselines.map((b) => getDateKey(parseLocalDate(b.date))))
    const baselineMap = new Map<string, { value: number; note: string }>()
    for (const b of visibleBaselines) {
      baselineMap.set(getDateKey(parseLocalDate(b.date)), { value: b.value, note: b.comments ?? "" })
    }

    const gap = gapDateKeys ?? new Set<string>()
    const allDayKeys = new Set<string>()
    const allDays: Date[] = []

    for (const day of days) {
      const key = getDateKey(day)
      if (!allDayKeys.has(key) && !gap.has(key)) { allDayKeys.add(key); allDays.push(day) }
    }
    for (const b of visibleBaselines) {
      const d = parseLocalDate(b.date); const key = getDateKey(d)
      if (!allDayKeys.has(key)) { allDayKeys.add(key); allDays.push(d) }
    }
    allDays.sort((a, b) => a.getTime() - b.getTime())

    return allDays.map((day) => {
      const key = getDateKey(day)
      const entry = entries[key]
      const bl = baselineMap.get(key)
      const isBaselineDay = baselineDateKeys.has(key)
      const hasData = entry && entry.occurrences > 0
      const occurrences = isBaselineDay ? null : (hasData ? entry.occurrences : null)

      // Calculate rate from appointment duration
      let rate: number | null = null
      let duration: number | null = null
      if (occurrences !== null && occurrences > 0) {
        const apt = appointmentsByDate.get(key)
        if (apt) {
          duration = getSessionDurationInUnit(apt.startsAt, apt.endsAt, unitOfTime)
          if (duration && duration > 0) {
            rate = occurrences / duration
          }
        }
      }

      const liveBaselineValue = isBaselineDay ? (hasData ? entry.occurrences : (bl?.value ?? null)) : null

      return {
        dateKey: key,
        dateLabel: format(day, labelFormat),
        fullDate: format(day, "EEEE, MMM dd yyyy"),
        rate,
        baselineValue: liveBaselineValue,
        hasNote: (entry?.environmentalNote ?? "").trim().length > 0 || (isBaselineDay && (bl?.note ?? "").trim().length > 0),
        note: (entry?.environmentalNote ?? "").trim().length > 0 ? entry.environmentalNote : (bl?.note ?? ""),
        isBaseline: isBaselineDay,
        occurrences,
        duration,
      }
    })
  }, [days, entries, baselines, isAggregated, aggregatedData, gapDateKeys, appointmentsByDate, unitOfTime])

  const hasBaselineData = data.some((p) => p.baselineValue != null)

  const objectiveValue = useMemo(() => {
    if (objectives.length === 0) return null
    return objectives[0].valueSmartCriteria ?? null
  }, [objectives])

  const yTitle = `Rate (occ/${unitLabel})`

  const { yMin, yMax, yTicks } = useMemo(() => {
    const allValues: number[] = []
    for (const point of data) {
      if (point.rate != null) allValues.push(point.rate)
      if (point.baselineValue != null) allValues.push(point.baselineValue)
    }
    if (objectiveValue != null) allValues.push(objectiveValue)
    const dataMax = allValues.length > 0 ? Math.max(...allValues) : 0
    const suggestedMax = chartConfig.yAxis?.suggestedMax ?? 5
    const effectiveMax = Math.max(suggestedMax, dataMax)
    const step = effectiveMax <= 1 ? 0.2 : effectiveMax <= 5 ? 1 : effectiveMax <= 10 ? 2 : effectiveMax <= 25 ? 5 : 10
    const ceilMax = Math.ceil(effectiveMax / step) * step + step
    const ticks: number[] = []
    for (let v = 0; v <= ceilMax; v += step) ticks.push(Math.round(v * 100) / 100)
    return { yMin: 0, yMax: ceilMax, yTicks: ticks }
  }, [data, objectiveValue, chartConfig.yAxis?.suggestedMax])

  // ─── Dataset visual configs ────────────────────────────────────────────

  const totalDatasetConfig = useMemo<ChartDatasetVisualConfig | null>(() => {
    if (!chartConfig.datasetConfigs) return null
    for (const id of chartConfig.datasets) {
      const cfg = chartConfig.datasetConfigs[id]
      if (cfg?.title?.toLowerCase() === "total") return cfg
    }
    const firstId = chartConfig.datasets[0]
    return firstId ? chartConfig.datasetConfigs[firstId] ?? null : null
  }, [chartConfig])

  const baselineDatasetConfig = useMemo<ChartDatasetVisualConfig | null>(() => {
    if (!chartConfig.datasetConfigs) return null
    for (const id of chartConfig.datasets) {
      const cfg = chartConfig.datasetConfigs[id]
      if (cfg?.title?.toLowerCase() === "baseline") return cfg
    }
    return null
  }, [chartConfig])

  const lineColor = totalDatasetConfig?.borderColor ?? "#037ECC"
  const lineType = totalDatasetConfig?.type ?? "LINE"
  const showValues = totalDatasetConfig?.showValues ?? false
  const baselineColor = baselineDatasetConfig?.borderColor ?? "#DC2626"
  const objVisual = chartConfig.objectives

  const pointCount = data.length
  const PX_PER_POINT = isAggregated ? 60 : 30
  const needsScroll = pointCount > (isAggregated ? 30 : 60)
  const chartWidth = needsScroll ? pointCount * PX_PER_POINT : undefined
  const chartHeight = 320
  const fontSize = pointCount > 90 ? 8 : pointCount > 30 ? 9 : 10

  const intervalLabel = isAggregated
    ? interval === ChartInterval.WEEKLY ? "Weekly" : interval === ChartInterval.MONTHLY ? "Monthly" : interval === ChartInterval.YEARLY ? "Yearly" : ""
    : ""

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">
            Rate Chart
            {intervalLabel && <span className="ml-1.5 text-xs font-medium text-slate-400">({intervalLabel})</span>}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{yTitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {hasBaselineData && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: baselineColor }} />
              <span className="text-xs text-slate-500">Baseline</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: lineColor }} />
            <span className="text-xs text-slate-500">Rate</span>
          </div>
          {objectiveValue !== null && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-5 border-t-2 border-dashed border-emerald-500" />
              <span className="text-xs text-slate-500">Objective: <span className="font-semibold text-emerald-500">{objectiveValue}</span></span>
            </div>
          )}
        </div>
      </div>

      <div className={needsScroll ? "overflow-x-auto custom-scrollbar" : undefined}>
      <ResponsiveContainer width={chartWidth ?? "100%"} height={chartHeight}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 93%)" vertical={false} />

          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            padding={{ left: 30, right: 10 }}
            interval={tickInterval}
            angle={isAggregated ? 0 : -45}
            textAnchor={isAggregated ? "middle" : "end"}
            height={isAggregated ? 40 : 70}
          />

          <YAxis
            domain={[yMin, yMax]}
            ticks={yTicks}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            width={45}
            type="number"
            allowDataOverflow
          />

          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0]?.payload as RateChartDataPoint | undefined
              return (
                <div className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs space-y-1 max-w-[240px]">
                  <p className="font-semibold">{point?.fullDate ?? label}</p>
                  {point?.baselineValue != null && (
                    <p>Baseline: <span className="font-bold" style={{ color: "#FCA5A5" }}>{point.baselineValue}</span></p>
                  )}
                  {point?.rate != null && (
                    <>
                      <p>Rate: <span className="font-bold">{point.rate.toFixed(2)}</span> occ/{unitLabel}</p>
                      {point.occurrences != null && <p className="text-slate-400">Occurrences: {point.occurrences}</p>}
                      {point.duration != null && <p className="text-slate-400">Duration: {point.duration.toFixed(1)} {unitLabel}</p>}
                    </>
                  )}
                  {point?.hasNote && point.note && (
                    <p className="text-teal-300 italic">{point.note}</p>
                  )}
                </div>
              )
            }}
            cursor={{ stroke: "#037ECC", strokeWidth: 1, strokeDasharray: "4 4" }}
          />

          {hasBaselineData && (
            <Line
              type="monotone"
              dataKey="baselineValue"
              stroke={baselineColor}
              strokeWidth={2}
              dot={{ r: 4, fill: "white", stroke: baselineColor, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: baselineColor, stroke: "white", strokeWidth: 2 }}
              connectNulls={false}
            />
          )}

          <ReferenceLine y={yMin} stroke="transparent" />
          <ReferenceLine y={yMax} stroke="transparent" />

          {objectiveValue !== null && objVisual?.showLine !== false && (
            <ReferenceLine
              y={objectiveValue}
              stroke={objVisual?.borderColor ?? "#22C55E"}
              strokeWidth={1.5}
              strokeDasharray={objVisual?.lineType === "SOLID" ? undefined : "8 4"}
            />
          )}

          {treatmentDateLabel && (
            <ReferenceLine
              x={treatmentDateLabel}
              stroke="#0F172A"
              strokeWidth={2}
              strokeDasharray="8 4"
              label={({ viewBox }: { viewBox: { x?: number; y?: number } }) => {
                const x = viewBox?.x ?? 0
                const y = (viewBox?.y ?? 0) + 6
                return (
                  <g>
                    <rect x={x - 38} y={y - 14} width={76} height={20} rx={10} fill="#0F172A" />
                    <text x={x} y={y} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600} letterSpacing={0.5}>Treatment</text>
                  </g>
                )
              }}
            />
          )}

          {stoPhases.map((sto) =>
            sto.startLabel !== treatmentDateLabel ? (
              <ReferenceLine key={`sto-start-${sto.number}`} x={sto.startLabel} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6 3" />
            ) : null
          )}
          {stoPhases.map((sto) =>
            sto.endLabel ? (
              <ReferenceLine key={`sto-end-${sto.number}`} x={sto.endLabel} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6 3" />
            ) : null
          )}
          {stoPhases.map((sto) => {
            if (!sto.endLabel) return null
            return (
              <ReferenceArea
                key={`sto-area-${sto.number}`}
                x1={sto.startLabel}
                x2={sto.endLabel}
                fill="transparent"
                strokeOpacity={0}
                label={({ viewBox }: { viewBox: { x?: number; y?: number; width?: number; height?: number } }) => {
                  const areaX = viewBox?.x ?? 0; const areaW = viewBox?.width ?? 0
                  const areaH = viewBox?.height ?? 0; const centerX = areaX + areaW / 2
                  const y = (viewBox?.y ?? 0) + areaH - 10
                  return (<text x={centerX} y={y} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight={600}>{`STO#${sto.number}`}</text>)
                }}
              />
            )
          })}

          {lineType === "BAR" ? (
            <Bar
              dataKey="rate"
              fill={lineColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={pointCount > 30 ? 12 : 32}
              label={showValues && pointCount <= 31 ? { position: "top", fontSize: 10, fill: "#64748B", formatter: (v: unknown) => typeof v === "number" ? v.toFixed(2) : String(v ?? "") } : false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="rate"
              stroke={lineColor}
              strokeWidth={pointCount > 60 ? 1.5 : 2.5}
              dot={pointCount > 30 ? false : { r: 4, fill: "white", stroke: lineColor, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: lineColor, stroke: "white", strokeWidth: 2 }}
              connectNulls={totalDatasetConfig?.spanGaps ?? false}
              label={showValues && pointCount <= 31 ? { position: "top", fontSize: 10, fill: "#64748B", formatter: (v: unknown) => typeof v === "number" ? v.toFixed(2) : String(v ?? "") } : false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
