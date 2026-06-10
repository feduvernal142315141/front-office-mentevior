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
  Legend,
} from "recharts"
import { format } from "date-fns"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import type { ChartConfig, ChartDatasetVisualConfig } from "@/lib/modules/service-plans/constants/chart.constants"
import { DEFAULT_CHART_CONFIG } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DayEntry } from "./frequency-datasheet.types"
import { getDateKey } from "./frequency-datasheet.types"

interface FrequencyChartProps {
  weekDays: Date[]
  entries: Record<string, DayEntry>
  dcConfig: DataCollectionConfig | null
}

interface ChartDataPoint {
  dateKey: string
  dateLabel: string
  fullDate: string
  occurrences: number | null
  hasNote: boolean
  note: string
}

export function FrequencyChart({ weekDays, entries, dcConfig }: FrequencyChartProps) {
  const chartConfig = dcConfig?.chart ?? DEFAULT_CHART_CONFIG
  const baselines = dcConfig?.baselines ?? []
  const objectives = dcConfig?.objectives ?? []

  const data = useMemo<ChartDataPoint[]>(() => {
    return weekDays.map((day) => {
      const key = getDateKey(day)
      const entry = entries[key]
      const hasData = entry && entry.occurrences > 0
      return {
        dateKey: key,
        dateLabel: format(day, "dd MMM"),
        fullDate: format(day, "EEEE, MMM dd yyyy"),
        occurrences: hasData ? entry.occurrences : null,
        hasNote: (entry?.environmentalNote ?? "").trim().length > 0,
        note: entry?.environmentalNote ?? "",
      }
    })
  }, [weekDays, entries])

  // Baseline value (average of all baselines for reference line)
  const baselineValue = useMemo(() => {
    const shown = baselines.filter((b) => b.show && b.value > 0)
    if (shown.length === 0) return null
    return shown.reduce((sum, b) => sum + b.value, 0) / shown.length
  }, [baselines])

  // Objective target value (first objective's smart criteria value)
  const objectiveValue = useMemo(() => {
    if (objectives.length === 0) return null
    return objectives[0].valueSmartCriteria ?? null
  }, [objectives])

  const objectiveName = objectives.length > 0 ? objectives[0].name : null

  // Resolve Y-axis range
  const yMin = chartConfig.yAxis?.suggestedMin ?? 0
  const yMax = chartConfig.yAxis?.suggestedMax ?? undefined
  const yTitle = chartConfig.yAxis?.title ?? "Number of occurrences"
  const xTitle = chartConfig.xAxis?.title ?? "Dates"

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

  // Environmental change dates for vertical reference lines
  const envChangeDates = useMemo(() => {
    return data.filter((d) => d.hasNote).map((d) => ({ dateLabel: d.dateLabel, note: d.note }))
  }, [data])

  // Objectives visual config
  const objVisual = chartConfig.objectives

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Chart</h4>
          {yTitle && <p className="text-[11px] text-slate-400 mt-0.5">{yTitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {baselineValue !== null && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: baselineColor }} />
              <span className="text-xs text-slate-500">Baseline: <span className="font-semibold" style={{ color: baselineColor }}>{baselineValue}</span></span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: lineColor }} />
            <span className="text-xs text-slate-500">Total</span>
          </div>
          {objectiveValue !== null && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-5 border-t-2 border-dashed border-emerald-500" />
              <span className="text-xs text-slate-500">Objective: <span className="font-semibold text-emerald-500">{objectiveValue}</span></span>
            </div>
          )}
          {envChangeDates.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-0 border-l border-dashed border-slate-400" />
              <span className="text-xs text-slate-500">Env. Change</span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(240 20% 93%)"
            vertical={chartConfig.xAxis?.hideGrid !== false ? false : true}
            horizontal={chartConfig.yAxis?.hideGrid !== false ? true : false}
          />

          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />

          <YAxis
            domain={[yMin, yMax ?? "auto"]}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            width={45}
          />

          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0]?.payload as ChartDataPoint | undefined
              return (
                <div className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs space-y-1 max-w-[220px]">
                  <p className="font-semibold">{point?.fullDate ?? label}</p>
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

          {/* Baseline reference line */}
          {baselineValue !== null && (
            <ReferenceLine
              y={baselineValue}
              stroke={baselineColor}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          )}

          {/* Objective reference line */}
          {objectiveValue !== null && objVisual?.showLine !== false && (
            <ReferenceLine
              y={objectiveValue}
              stroke={objVisual?.borderColor ?? "#22C55E"}
              strokeWidth={1.5}
              strokeDasharray={objVisual?.lineType === "SOLID" ? undefined : "8 4"}
            />
          )}

          {/* Environmental changes — vertical dashed lines */}
          {envChangeDates.map((env) => (
            <ReferenceLine
              key={env.dateLabel}
              x={env.dateLabel}
              stroke="#94A3B8"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          ))}

          {/* Main data series */}
          {lineType === "BAR" ? (
            <Bar
              dataKey="occurrences"
              fill={lineColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              label={showValues ? { position: "top", fontSize: 10, fill: "#64748B" } : false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="occurrences"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{ r: 4, fill: "white", stroke: lineColor, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: lineColor, stroke: "white", strokeWidth: 2 }}
              connectNulls={totalDatasetConfig?.spanGaps ?? false}
              label={showValues ? { position: "top", fontSize: 10, fill: "#64748B" } : false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
