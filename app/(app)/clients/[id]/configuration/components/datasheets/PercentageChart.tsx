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
} from "recharts"
import { format } from "date-fns"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import type { ChartDatasetVisualConfig } from "@/lib/modules/service-plans/constants/chart.constants"
import { DEFAULT_CHART_CONFIG } from "@/lib/modules/service-plans/constants/chart.constants"
import { type PercentageDayEntry, getDateKey, calculatePercentage, countYes } from "./percentage-datasheet.types"

interface PercentageChartProps {
  weekDays: Date[]
  entries: Record<string, PercentageDayEntry>
  dcConfig: DataCollectionConfig | null
  /** Override days for the chart (from date range toolbar). Falls back to weekDays. */
  chartDays?: Date[]
  /** Show every Nth X-axis label (0 = show all). */
  tickInterval?: number
}

interface ChartDataPoint {
  dateKey: string
  dateLabel: string
  fullDate: string
  percentage: number | null
  yesCount: number
  totalTrials: number
  hasNote: boolean
  note: string
}

export function PercentageChart({ weekDays, entries, dcConfig, chartDays, tickInterval = 0 }: PercentageChartProps) {
  const days = chartDays ?? weekDays
  const labelFormat = "MM/dd/yyyy"
  const chartConfig = dcConfig?.chart ?? DEFAULT_CHART_CONFIG
  const baselines = dcConfig?.baselines ?? []
  const objectives = dcConfig?.objectives ?? []

  const data = useMemo<ChartDataPoint[]>(() => {
    return days.map((day) => {
      const key = getDateKey(day)
      const entry = entries[key]
      const pct = entry ? calculatePercentage(entry) : null
      return {
        dateKey: key,
        dateLabel: format(day, labelFormat),
        fullDate: format(day, "EEEE, MMM dd yyyy"),
        percentage: pct,
        yesCount: entry ? countYes(entry) : 0,
        totalTrials: entry?.numberOfTrials ?? 0,
        hasNote: (entry?.environmentalNote ?? "").trim().length > 0,
        note: entry?.environmentalNote ?? "",
      }
    })
  }, [days, entries, labelFormat])

  const baselineValue = useMemo(() => {
    const shown = baselines.filter((b) => b.show && b.value > 0)
    if (shown.length === 0) return null
    return shown.reduce((sum, b) => sum + b.value, 0) / shown.length
  }, [baselines])

  const objectiveValue = useMemo(() => {
    if (objectives.length === 0) return null
    return objectives[0].valueSmartCriteria ?? null
  }, [objectives])

  const yTitle = chartConfig.yAxis?.title ?? "Percentage (%)"
  const xTitle = chartConfig.xAxis?.title ?? "Dates"

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

  const envChangeDates = useMemo(() => {
    return data.filter((d) => d.hasNote).map((d) => ({ dateLabel: d.dateLabel, note: d.note }))
  }, [data])

  const objVisual = chartConfig.objectives

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
          {baselineValue !== null && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: baselineColor }} />
              <span className="text-xs text-slate-500">Baseline: <span className="font-semibold" style={{ color: baselineColor }}>{baselineValue}%</span></span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: lineColor }} />
            <span className="text-xs text-slate-500">Percentage</span>
          </div>
          {objectiveValue !== null && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-5 border-t-2 border-dashed border-emerald-500" />
              <span className="text-xs text-slate-500">Objective: <span className="font-semibold text-emerald-500">{objectiveValue}%</span></span>
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

      <div className={needsScroll ? "overflow-x-auto custom-scrollbar" : undefined}>
      <ResponsiveContainer width={chartWidth ?? "100%"} height={chartHeight}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 93%)" vertical={false} />

          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: days.length > 90 ? 8 : days.length > 30 ? 9 : 10, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            padding={{ left: 5, right: 5 }}
            interval={tickInterval}
            angle={-45}
            textAnchor="end"
            height={70}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            width={45}
            tickFormatter={(v: number) => `${v}%`}
          />

          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0]?.payload as ChartDataPoint | undefined
              return (
                <div className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs space-y-1 max-w-[220px]">
                  <p className="font-semibold">{point?.fullDate ?? label}</p>
                  {point?.percentage != null && (
                    <p>Percentage: <span className="font-bold">{point.percentage}%</span></p>
                  )}
                  {point?.totalTrials != null && point.totalTrials > 0 && (
                    <p className="text-slate-300">{point.yesCount}/{point.totalTrials} Yes</p>
                  )}
                  {point?.hasNote && (
                    <p className="text-teal-300 italic">{point.note}</p>
                  )}
                </div>
              )
            }}
            cursor={{ stroke: "#037ECC", strokeWidth: 1, strokeDasharray: "4 4" }}
          />

          {baselineValue !== null && (
            <ReferenceLine y={baselineValue} stroke={baselineColor} strokeWidth={1.5} strokeDasharray="6 4" />
          )}

          {objectiveValue !== null && objVisual?.showLine !== false && (
            <ReferenceLine
              y={objectiveValue}
              stroke={objVisual?.borderColor ?? "#22C55E"}
              strokeWidth={1.5}
              strokeDasharray={objVisual?.lineType === "SOLID" ? undefined : "8 4"}
            />
          )}

          {envChangeDates.map((env) => (
            <ReferenceLine key={env.dateLabel} x={env.dateLabel} stroke="#94A3B8" strokeWidth={1} strokeDasharray="4 3" />
          ))}

          {lineType === "BAR" ? (
            <Bar dataKey="percentage" fill={lineColor} radius={[4, 4, 0, 0]} maxBarSize={days.length > 30 ? 12 : 32} label={showValues && days.length <= 31 ? { position: "top" as const, fontSize: 10, fill: "#64748B" } : false} />
          ) : (
            <Line
              type="monotone"
              dataKey="percentage"
              stroke={lineColor}
              strokeWidth={days.length > 60 ? 1.5 : 2.5}
              dot={days.length > 30 ? false : { r: 4, fill: "white", stroke: lineColor, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: lineColor, stroke: "white", strokeWidth: 2 }}
              connectNulls={totalDatasetConfig?.spanGaps ?? false}
              label={showValues && days.length <= 31 ? { position: "top" as const, fontSize: 10, fill: "#64748B" } : false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
