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
import type { DayEntry } from "./frequency-datasheet.types"
import { getDateKey, parseLocalDate } from "./frequency-datasheet.types"
import { dateToPeriodLabel, type AggregatedDataPoint } from "./aggregate-chart-data"

interface FrequencyChartProps {
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
}

interface ChartDataPoint {
  dateKey: string
  dateLabel: string
  fullDate: string
  occurrences: number | null
  baselineValue: number | null
  hasNote: boolean
  note: string
  isBaseline?: boolean
  aggregatedCount?: number
}

export function FrequencyChart({
  weekDays, entries, dcConfig, chartDays, tickInterval = 0,
  itemBaselines, itemObjectives, gapDateKeys,
  aggregatedData, interval = ChartInterval.DAILY,
}: FrequencyChartProps) {
  const days = chartDays ?? weekDays
  const labelFormat = "MM/dd/yyyy"
  const chartConfig = dcConfig?.chart ?? DEFAULT_CHART_CONFIG
  const objectives = dcConfig?.objectives ?? []
  const isAggregated = interval !== ChartInterval.DAILY && interval !== ChartInterval.SESSION && !!aggregatedData

  // ─── Phase markers (treatment + STO lines) ─────────────────────────────

  // Treatment start = first STO startDate (STO1)
  const treatmentStartDate = useMemo(() => {
    const objs = itemObjectives ?? []
    if (objs.length === 0) return null
    const sorted = [...objs]
      .filter((o) => o.startDate)
      .sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
    if (sorted.length === 0) return null
    return parseLocalDate(sorted[0].startDate)
  }, [itemObjectives])

  const treatmentDateLabel = useMemo(() => {
    if (!treatmentStartDate) return null
    return isAggregated ? dateToPeriodLabel(treatmentStartDate, interval) : format(treatmentStartDate, labelFormat)
  }, [treatmentStartDate, labelFormat, isAggregated, interval])

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
  }, [itemObjectives, labelFormat, isAggregated, interval])

  // ─── Baselines (daily mode only; aggregated mode baselines come from aggregatedData) ─

  const baselines = useMemo(() => {
    if (itemBaselines && itemBaselines.length > 0) {
      return itemBaselines.map((b) => ({
        date: b.date, value: b.value, show: b.show,
        comments: b.environmentalChanges ?? "", periodCatalogId: b.periodCatalogId,
      }))
    }
    return dcConfig?.baselines ?? []
  }, [itemBaselines, dcConfig?.baselines])

  // ─── Build chart data points ───────────────────────────────────────────

  const data = useMemo<ChartDataPoint[]>(() => {
    // AGGREGATED MODE: use pre-computed aggregated data
    if (isAggregated && aggregatedData) {
      return aggregatedData.map((ap) => ({
        dateKey: ap.periodKey,
        dateLabel: ap.periodLabel,
        fullDate: ap.periodLabel,
        occurrences: ap.value,
        baselineValue: ap.baselineValue,
        hasNote: ap.hasNote,
        note: "",
        isBaseline: ap.isBaseline,
        aggregatedCount: ap.count,
      }))
    }

    // DAILY MODE: build from raw entries (existing logic)
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
      // Any date before STO1 startDate is considered part of the baseline phase
      const isBeforeTreatment = treatmentStartDate ? day.getTime() < treatmentStartDate.getTime() : false
      const isBaselinePhase = isBaselineDay || isBeforeTreatment
      const hasData = entry && entry.occurrences > 0

      // Baseline value: show for baseline records AND any data before treatment start
      const liveBaselineValue = isBaselinePhase
        ? (hasData ? entry.occurrences : (bl?.value ?? null))
        : null

      // Treatment value: only show for dates ON or AFTER treatment start and not baseline records
      const treatmentValue = !isBaselinePhase && hasData ? entry.occurrences : null

      return {
        dateKey: key,
        dateLabel: format(day, labelFormat),
        fullDate: format(day, "EEEE, MMM dd yyyy"),
        occurrences: treatmentValue,
        baselineValue: liveBaselineValue,
        hasNote: (entry?.environmentalNote ?? "").trim().length > 0 || (isBaselineDay && (bl?.note ?? "").trim().length > 0),
        note: (entry?.environmentalNote ?? "").trim().length > 0 ? entry.environmentalNote : (bl?.note ?? ""),
        isBaseline: isBaselinePhase,
      }
    })
  }, [days, entries, baselines, labelFormat, isAggregated, aggregatedData, gapDateKeys, treatmentStartDate])

  const hasBaselineData = data.some((p) => p.baselineValue != null)

  // ─── Objective target value ────────────────────────────────────────────

  const objectiveValue = useMemo(() => {
    if (objectives.length === 0) return null
    return objectives[0].valueSmartCriteria ?? null
  }, [objectives])

  // ─── Y-axis range ──────────────────────────────────────────────────────

  const yTitle = chartConfig.yAxis?.title ?? "Number of occurrences"

  const { yMin, yMax, yTicks } = useMemo(() => {
    const allValues: number[] = []
    for (const point of data) {
      if (point.occurrences != null) allValues.push(point.occurrences)
      if (point.baselineValue != null) allValues.push(point.baselineValue)
    }
    if (objectiveValue != null) allValues.push(objectiveValue)
    const dataMax = allValues.length > 0 ? Math.max(...allValues) : 0
    const suggestedMax = chartConfig.yAxis?.suggestedMax ?? 20
    const effectiveMax = Math.max(suggestedMax, dataMax)
    const step = effectiveMax <= 10 ? 2 : effectiveMax <= 25 ? 5 : effectiveMax <= 50 ? 10 : effectiveMax <= 100 ? 20 : Math.ceil(effectiveMax / 5 / 10) * 10
    const ceilMax = Math.ceil(effectiveMax / step) * step + step
    const ticks: number[] = []
    for (let v = 0; v <= ceilMax; v += step) ticks.push(v)
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

  // ─── Layout ────────────────────────────────────────────────────────────

  const pointCount = data.length
  const PX_PER_POINT = isAggregated ? 60 : 30
  const needsScroll = pointCount > (isAggregated ? 30 : 60)
  const chartWidth = needsScroll ? pointCount * PX_PER_POINT : undefined
  const chartHeight = 240
  const fontSize = pointCount > 90 ? 8 : pointCount > 30 ? 9 : 10

  // ─── Interval label for header ─────────────────────────────────────────

  const intervalLabel = isAggregated
    ? interval === ChartInterval.WEEKLY ? "Weekly" : interval === ChartInterval.MONTHLY ? "Monthly" : interval === ChartInterval.YEARLY ? "Yearly" : ""
    : ""

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">
            Chart
            {intervalLabel && <span className="ml-1.5 text-xs font-medium text-slate-400">({intervalLabel})</span>}
          </h4>
          {yTitle && <p className="text-[11px] text-slate-400 mt-0.5">{yTitle}</p>}
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
            <span className="text-xs text-slate-500">Treatment</span>
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
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(240 20% 93%)"
            vertical={chartConfig.xAxis?.hideGrid !== false ? false : true}
            horizontal={chartConfig.yAxis?.hideGrid !== false ? true : false}
          />

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
              const point = payload[0]?.payload as ChartDataPoint | undefined
              return (
                <div className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs space-y-1 max-w-[240px]">
                  <p className="font-semibold">{point?.fullDate ?? label}</p>
                  {point?.baselineValue != null && (
                    <p>Baseline: <span className="font-bold" style={{ color: "#FCA5A5" }}>{Number.isInteger(point.baselineValue) ? point.baselineValue : point.baselineValue.toFixed(1)}</span></p>
                  )}
                  {point?.occurrences != null && (
                    <p>Value: <span className="font-bold">{Number.isInteger(point.occurrences) ? point.occurrences : point.occurrences.toFixed(1)}</span>
                      {point.aggregatedCount != null && point.aggregatedCount > 0 && (
                        <span className="text-slate-400 ml-1">({point.aggregatedCount} session{point.aggregatedCount !== 1 ? "s" : ""})</span>
                      )}
                    </p>
                  )}
                  {point?.hasNote && point.note && (
                    <p className="text-teal-300 italic">{point.note}</p>
                  )}
                </div>
              )
            }}
            cursor={{ stroke: "#037ECC", strokeWidth: 1, strokeDasharray: "4 4" }}
          />

          {/* Baseline data series */}
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

          {/* Objective reference line */}
          {objectiveValue !== null && objVisual?.showLine !== false && (
            <ReferenceLine
              y={objectiveValue}
              stroke={objVisual?.borderColor ?? "#22C55E"}
              strokeWidth={1.5}
              strokeDasharray={objVisual?.lineType === "SOLID" ? undefined : "8 4"}
            />
          )}

          {/* Treatment vertical line */}
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

          {/* STO phase markers */}
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

          {/* Main data series */}
          {lineType === "BAR" ? (
            <Bar
              dataKey="occurrences"
              fill={lineColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={pointCount > 30 ? 12 : 32}
              label={showValues && pointCount <= 31 ? { position: "top", fontSize: 10, fill: "#64748B" } : false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="occurrences"
              stroke={lineColor}
              strokeWidth={pointCount > 60 ? 1.5 : 2.5}
              dot={pointCount > 30 ? false : { r: 4, fill: "white", stroke: lineColor, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: lineColor, stroke: "white", strokeWidth: 2 }}
              connectNulls={totalDatasetConfig?.spanGaps ?? false}
              label={showValues && pointCount <= 31 ? { position: "top", fontSize: 10, fill: "#64748B" } : false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
