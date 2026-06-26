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
  Legend,
} from "recharts"
import { format } from "date-fns"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import type { ClientServicePlanItemBaseline, ClientServicePlanItemObjective } from "@/lib/types/client-service-plan.types"
import type { ChartConfig, ChartDatasetVisualConfig } from "@/lib/modules/service-plans/constants/chart.constants"
import { DEFAULT_CHART_CONFIG } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DayEntry } from "./frequency-datasheet.types"
import { getDateKey, parseLocalDate } from "./frequency-datasheet.types"

interface FrequencyChartProps {
  weekDays: Date[]
  entries: Record<string, DayEntry>
  dcConfig: DataCollectionConfig | null
  /** Override days for the chart (from date range toolbar). Falls back to weekDays. */
  chartDays?: Date[]
  /** Show every Nth X-axis label (0 = show all). */
  tickInterval?: number
  /** Item-level baselines from the API */
  itemBaselines?: ClientServicePlanItemBaseline[]
  /** Item-level objectives (STOs) from the API */
  itemObjectives?: ClientServicePlanItemObjective[]
  /** Date keys to hide (gap between last baseline and first STO) */
  gapDateKeys?: Set<string>
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
}

export function FrequencyChart({ weekDays, entries, dcConfig, chartDays, tickInterval = 0, itemBaselines, itemObjectives, gapDateKeys }: FrequencyChartProps) {
  const days = chartDays ?? weekDays
  // Use shorter label format for larger ranges
  const labelFormat = "MM/dd/yyyy"
  const chartConfig = dcConfig?.chart ?? DEFAULT_CHART_CONFIG
  const objectives = dcConfig?.objectives ?? []

  // Treatment line: first STO start date
  const treatmentDateLabel = useMemo(() => {
    const objs = itemObjectives ?? []
    if (objs.length === 0) return null
    const sorted = [...objs]
      .filter((o) => o.startDate)
      .sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
    if (sorted.length === 0) return null
    return format(parseLocalDate(sorted[0].startDate), labelFormat)
  }, [itemObjectives, labelFormat])

  // STO phase markers: each objective gets two vertical lines (start + end) with label in between
  const stoPhases = useMemo(() => {
    const objs = itemObjectives ?? []
    if (objs.length === 0) return []
    const sorted = [...objs]
      .filter((o) => o.startDate)
      .sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
    return sorted.map((obj, idx) => ({
      number: idx + 1,
      startLabel: format(parseLocalDate(obj.startDate), labelFormat),
      endLabel: obj.endDate ? format(parseLocalDate(obj.endDate), labelFormat) : null,
    }))
  }, [itemObjectives, labelFormat])

  // Merge baselines: prefer item-level baselines, fall back to category-level
  const baselines = useMemo(() => {
    if (itemBaselines && itemBaselines.length > 0) {
      // Map item baselines to the same shape used by the chart
      return itemBaselines.map((b) => ({
        date: b.date,
        value: b.value,
        show: b.show,
        comments: b.environmentalChanges ?? "",
        periodCatalogId: b.periodCatalogId,
      }))
    }
    return dcConfig?.baselines ?? []
  }, [itemBaselines, dcConfig?.baselines])

  const data = useMemo<ChartDataPoint[]>(() => {
    // Build a set of baseline date keys for quick lookup
    const visibleBaselines = baselines
      .filter((b) => b.show && b.value > 0 && b.date)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())

    const baselineDateKeys = new Set(
      visibleBaselines.map((b) => {
        const d = parseLocalDate(b.date)
        return getDateKey(d)
      })
    )

    // Build a map of baseline values by date key
    const baselineMap = new Map<string, { value: number; note: string }>()
    for (const b of visibleBaselines) {
      const d = parseLocalDate(b.date)
      const key = getDateKey(d)
      baselineMap.set(key, { value: b.value, note: b.comments ?? "" })
    }

    const gap = gapDateKeys ?? new Set<string>()
    const allDayKeys = new Set<string>()
    const allDays: Date[] = []

    // Add chart range days (skip gap dates between baseline and treatment)
    for (const day of days) {
      const key = getDateKey(day)
      if (!allDayKeys.has(key) && !gap.has(key)) {
        allDayKeys.add(key)
        allDays.push(day)
      }
    }

    // Add baseline dates that may fall outside the chart range
    for (const b of visibleBaselines) {
      const d = parseLocalDate(b.date)
      const key = getDateKey(d)
      if (!allDayKeys.has(key)) {
        allDayKeys.add(key)
        allDays.push(d)
      }
    }

    // Sort all days chronologically
    allDays.sort((a, b) => a.getTime() - b.getTime())

    // Build data points
    const points: ChartDataPoint[] = allDays.map((day) => {
      const key = getDateKey(day)
      const entry = entries[key]
      const bl = baselineMap.get(key)
      const isBaselineDay = baselineDateKeys.has(key)
      const hasData = entry && entry.occurrences > 0

      // For baseline days, use the live entry value (editable in grid) falling back to API value
      const liveBaselineValue = isBaselineDay
        ? (hasData ? entry.occurrences : (bl?.value ?? null))
        : null

      return {
        dateKey: key,
        dateLabel: format(day, labelFormat),
        fullDate: format(day, "EEEE, MMM dd yyyy"),
        occurrences: isBaselineDay ? null : (hasData ? entry.occurrences : null),
        baselineValue: liveBaselineValue,
        hasNote: (entry?.environmentalNote ?? "").trim().length > 0
          || (isBaselineDay && (bl?.note ?? "").trim().length > 0),
        note: (entry?.environmentalNote ?? "").trim().length > 0
          ? entry.environmentalNote
          : (bl?.note ?? ""),
        isBaseline: isBaselineDay,
      }
    })

    return points
  }, [days, entries, baselines, labelFormat])

  const hasBaselineData = baselines.some((b) => b.show && b.value > 0 && b.date)

  // Objective target value (first objective's smart criteria value)
  const objectiveValue = useMemo(() => {
    if (objectives.length === 0) return null
    return objectives[0].valueSmartCriteria ?? null
  }, [objectives])

  const objectiveName = objectives.length > 0 ? objectives[0].name : null

  // Resolve Y-axis range dynamically from data
  const yTitle = chartConfig.yAxis?.title ?? "Number of occurrences"
  const xTitle = chartConfig.xAxis?.title ?? "Dates"

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

    // Round up to a nice number
    const step = effectiveMax <= 10 ? 2 : effectiveMax <= 25 ? 5 : effectiveMax <= 50 ? 10 : effectiveMax <= 100 ? 20 : Math.ceil(effectiveMax / 5 / 10) * 10
    const ceilMax = Math.ceil(effectiveMax / step) * step + step

    const ticks: number[] = []
    for (let v = 0; v <= ceilMax; v += step) {
      ticks.push(v)
    }

    return { yMin: 0, yMax: ceilMax, yTicks: ticks }
  }, [data, objectiveValue, chartConfig.yAxis?.suggestedMax])

  // Find the "Total" dataset config for main line styling
  const totalDatasetConfig = useMemo<ChartDatasetVisualConfig | null>(() => {
    if (!chartConfig.datasetConfigs) return null
    for (const id of chartConfig.datasets) {
      const cfg = chartConfig.datasetConfigs[id]
      if (cfg?.title?.toLowerCase() === "total") return cfg
    }
    // Fallback: first dataset config
    const firstId = chartConfig.datasets[0]
    return firstId ? chartConfig.datasetConfigs[firstId] ?? null : null
  }, [chartConfig])

  // Find the "Baseline" dataset config for baseline line styling
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

  // Objectives visual config
  const objVisual = chartConfig.objectives

  // For 3M+ (>60 days), use fixed width per point with horizontal scroll
  const PX_PER_POINT = 30
  const needsScroll = days.length > 60
  const chartWidth = needsScroll ? days.length * PX_PER_POINT : undefined
  const chartHeight = 320

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Chart</h4>
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
            tick={{ fontSize: days.length > 90 ? 8 : days.length > 30 ? 9 : 10, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            padding={{ left: 30, right: 10 }}
            interval={tickInterval}
            angle={-45}
            textAnchor="end"
            height={70}
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
                <div className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs space-y-1 max-w-[220px]">
                  <p className="font-semibold">{point?.fullDate ?? label}</p>
                  {point?.baselineValue != null && (
                    <p>Baseline: <span className="font-bold" style={{ color: "#FCA5A5" }}>{point.baselineValue}</span></p>
                  )}
                  {point?.occurrences != null && (
                    <p>Occurrences: <span className="font-bold">{point.occurrences}</span></p>
                  )}
                  {point?.hasNote && (
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

          {/* Invisible anchors to force Y axis domain when no data */}
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

          {/* Treatment vertical line — first STO start date */}
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
                    <text x={x} y={y} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600} letterSpacing={0.5}>
                      Treatment
                    </text>
                  </g>
                )
              }}
            />
          )}

          {/* STO phase markers — start line (skip if same as treatment), end line, label centered */}
          {stoPhases.map((sto) =>
            sto.startLabel !== treatmentDateLabel ? (
              <ReferenceLine
                key={`sto-start-${sto.number}`}
                x={sto.startLabel}
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="6 3"
              />
            ) : null
          )}
          {stoPhases.map((sto) =>
            sto.endLabel ? (
              <ReferenceLine
                key={`sto-end-${sto.number}`}
                x={sto.endLabel}
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="6 3"
              />
            ) : null
          )}
          {/* STO labels — ReferenceArea gives us both x1 and x2 to center the label */}
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
                  const areaX = viewBox?.x ?? 0
                  const areaW = viewBox?.width ?? 0
                  const areaH = viewBox?.height ?? 0
                  const centerX = areaX + areaW / 2
                  const y = (viewBox?.y ?? 0) + areaH - 10
                  return (
                    <text x={centerX} y={y} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight={600}>
                      {`STO#${sto.number}`}
                    </text>
                  )
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
              maxBarSize={days.length > 30 ? 12 : 32}
              label={showValues && days.length <= 31 ? { position: "top", fontSize: 10, fill: "#64748B" } : false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="occurrences"
              stroke={lineColor}
              strokeWidth={days.length > 60 ? 1.5 : 2.5}
              dot={days.length > 30 ? false : { r: 4, fill: "white", stroke: lineColor, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: lineColor, stroke: "white", strokeWidth: 2 }}
              connectNulls={totalDatasetConfig?.spanGaps ?? false}
              label={showValues && days.length <= 31 ? { position: "top", fontSize: 10, fill: "#64748B" } : false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
