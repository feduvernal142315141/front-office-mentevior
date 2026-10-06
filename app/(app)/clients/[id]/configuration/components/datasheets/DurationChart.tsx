"use client"

import { useMemo } from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
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
import { getDateKey, parseLocalDate } from "./frequency-datasheet.types"
import { shouldPinTreatmentDay } from "./chart-gaps"
import { dateToPeriodLabel, type AggregatedDataPoint } from "./aggregate-chart-data"
import { computeTrendInfo, resolveActiveObjective, TrendFooter } from "./chart-trend"
import { DEFAULT_ENVIRONMENTAL_CHANGES } from "@/lib/constants/environmental-changes"
import type { EnvironmentalChangesDisplay } from "@/lib/types/data-collection.types"
import {
  buildEnvChangeMarkers,
  renderEnvChangeMarkers,
  shouldShowEnvChangeLegendChip,
} from "./environmental-changes-display"

interface DurationChartProps {
  weekDays: Date[]
  entries: Record<string, { occurrences: number; initials: string; environmentalNote: string }>
  dcConfig: DataCollectionConfig | null
  chartDays?: Date[]
  tickInterval?: number
  itemBaselines?: ClientServicePlanItemBaseline[]
  itemObjectives?: ClientServicePlanItemObjective[]
  gapDateKeys?: Set<string>
  /**
   * Dates whose value comes from data collection (saved DC records or the live session
   * value). They are ALWAYS plotted as treatment, never as baseline — even if the date
   * also has a configured baseline or the first STO hasn't started yet.
   */
  collectedDateKeys?: Set<string>
  aggregatedData?: AggregatedDataPoint[]
  interval?: ChartInterval
  unitLabel: string
  /**
   * Cómo pinta este item sus environmental changes (contrato 2026-09-07).
   * Sin config, el comportamiento histórico: línea de fase + listado.
   */
  environmentalChanges?: EnvironmentalChangesDisplay
}

interface DurationChartDataPoint {
  /** Horizontal position: the column index, so markers can sit between two columns. */
  x: number
  dateKey: string
  dateLabel: string
  fullDate: string
  value: number | null
  baselineValue: number | null
  hasNote: boolean
  note: string
  isBaseline?: boolean
  aggregatedCount?: number
}

export function DurationChart({
  weekDays, entries, dcConfig, chartDays, tickInterval = 0,
  itemBaselines, itemObjectives, gapDateKeys, collectedDateKeys,
  aggregatedData, interval = ChartInterval.DAILY,
  unitLabel,
  environmentalChanges = DEFAULT_ENVIRONMENTAL_CHANGES,
}: DurationChartProps) {
  const days = chartDays ?? weekDays
  const labelFormat = "MM/dd/yyyy"
  const chartConfig = dcConfig?.chart ?? DEFAULT_CHART_CONFIG
  const objectives = dcConfig?.objectives ?? []
  const isAggregated = interval !== ChartInterval.DAILY && interval !== ChartInterval.SESSION && !!aggregatedData

  // Phase markers
  const treatmentStartDate = useMemo(() => {
    const objs = itemObjectives ?? []
    if (objs.length === 0) return null
    const sorted = [...objs].filter((o) => o.startDate).sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
    if (sorted.length === 0) return null
    return parseLocalDate(sorted[0].startDate)
  }, [itemObjectives])

  const treatmentDateLabel = useMemo(() => {
    if (!treatmentStartDate) return null
    return isAggregated ? dateToPeriodLabel(treatmentStartDate, interval) : format(treatmentStartDate, labelFormat)
  }, [treatmentStartDate, isAggregated, interval, labelFormat])

  const stoPhases = useMemo(() => {
    const objs = itemObjectives ?? []
    if (objs.length === 0) return []
    const sorted = [...objs].filter((o) => o.startDate).sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
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

  const baselines = useMemo(() => {
    if (itemBaselines && itemBaselines.length > 0) {
      return itemBaselines.map((b) => ({ date: b.date, value: b.value, show: b.show, comments: b.environmentalChanges ?? "", periodCatalogId: b.periodCatalogId }))
    }
    return dcConfig?.baselines ?? []
  }, [itemBaselines, dcConfig?.baselines])

  // Build data
  const data = useMemo<DurationChartDataPoint[]>(() => {
    if (isAggregated && aggregatedData) {
      return aggregatedData.map((ap, index) => ({
        x: index,
        dateKey: ap.periodKey, dateLabel: ap.periodLabel, fullDate: ap.periodLabel,
        value: ap.value, baselineValue: ap.baselineValue, hasNote: ap.hasNote, note: "",
        isBaseline: ap.isBaseline, aggregatedCount: ap.count,
      }))
    }

    const visibleBaselines = baselines.filter((b) => b.show && b.value > 0 && b.date).sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    const baselineDateKeys = new Set(visibleBaselines.map((b) => getDateKey(parseLocalDate(b.date))))
    const baselineMap = new Map<string, { value: number; note: string }>()
    for (const b of visibleBaselines) baselineMap.set(getDateKey(parseLocalDate(b.date)), { value: b.value, note: b.comments ?? "" })

    const gap = gapDateKeys ?? new Set<string>()
    const allDayKeys = new Set<string>()
    const allDays: Date[] = []
    for (const day of days) { const key = getDateKey(day); if (!allDayKeys.has(key) && !gap.has(key)) { allDayKeys.add(key); allDays.push(day) } }
    for (const b of visibleBaselines) { const d = parseLocalDate(b.date); const key = getDateKey(d); if (!allDayKeys.has(key)) { allDayKeys.add(key); allDays.push(d) } }
    // Treatment starting between the pinned baselines and the range keeps its own column
    if (treatmentStartDate && shouldPinTreatmentDay(treatmentStartDate, allDays)) allDays.push(treatmentStartDate)
    allDays.sort((a, b) => a.getTime() - b.getTime())

    return allDays.map((day, index) => {
      const key = getDateKey(day)
      const entry = entries[key]
      const bl = baselineMap.get(key)
      const isBaselineDay = baselineDateKeys.has(key)
      const isBeforeTreatment = treatmentStartDate ? day.getTime() < treatmentStartDate.getTime() : false
      // A collected value is data collection, so it stays in the treatment series
      const isCollected = collectedDateKeys?.has(key) ?? false
      const isBaselinePhase = !isCollected && (isBaselineDay || isBeforeTreatment)
      const hasData = entry && entry.occurrences > 0
      const liveBaselineValue = isBaselinePhase
        ? (hasData ? entry.occurrences : (bl?.value ?? null))
        : (isBaselineDay ? (bl?.value ?? null) : null)

      return {
        x: index,
        dateKey: key, dateLabel: format(day, labelFormat), fullDate: format(day, "EEEE, MMM dd yyyy"),
        value: isBaselinePhase ? null : (hasData ? entry.occurrences : null),
        baselineValue: liveBaselineValue,
        hasNote: (entry?.environmentalNote ?? "").trim().length > 0 || (isBaselineDay && (bl?.note ?? "").trim().length > 0),
        note: (entry?.environmentalNote ?? "").trim().length > 0 ? entry.environmentalNote : (bl?.note ?? ""),
        isBaseline: isBaselinePhase,
      }
    })
  }, [days, entries, baselines, isAggregated, aggregatedData, gapDateKeys, collectedDateKeys, treatmentStartDate])

  const hasBaselineData = data.some((p) => p.baselineValue != null)

  // ─── Axis position lookups (markers are anchored by date label) ────────

  const xByLabel = useMemo(() => {
    const map = new Map<string, number>()
    for (const point of data) map.set(point.dateLabel, point.x)
    return map
  }, [data])

  const labelByX = useMemo(() => {
    const map = new Map<number, string>()
    for (const point of data) map.set(point.x, point.dateLabel)
    return map
  }, [data])

  // A single datapoint would collapse the numeric domain — give it room so the dot still lands
  const xDomain = useMemo<[number, number]>(() => {
    if (data.length === 0) return [0, 1]
    const first = data[0].x
    const last = data[data.length - 1].x
    return first === last ? [first - 1, last + 1] : [first, last]
  }, [data])

  const xTicks = useMemo(
    () => data.filter((_, index) => index % (tickInterval + 1) === 0).map((point) => point.x),
    [data, tickInterval],
  )

  // The phase change is drawn BETWEEN the previous column and the start date's column, so the
  // first treatment datapoint (collected on the start date itself) never sits on top of the line.
  const treatmentLineX = useMemo(() => {
    if (!treatmentDateLabel) return null
    const x = xByLabel.get(treatmentDateLabel)
    if (x === undefined) return null
    return x > xDomain[0] ? x - 0.5 : x
  }, [treatmentDateLabel, xByLabel, xDomain])

  const activeObjective = useMemo(
    () => resolveActiveObjective(itemObjectives, objectives),
    [itemObjectives, objectives],
  )

  // Trend line
  // Trend is always evaluated against the objective in progress
  const trendInfo = useMemo(
    () => computeTrendInfo(
      data.map((p) => ({ dateKey: p.dateKey, value: p.value, isBaseline: p.isBaseline, })),
      activeObjective,
    ),
    [data, activeObjective],
  )

  const envChangeDates = useMemo(() => {
    return data.filter((p) => p.hasNote && p.note).map((p) => ({ dateLabel: p.dateLabel, note: p.note }))
  }, [data])

  // El proveedor elige cómo se ven (contrato 2026-09-07): línea, etiqueta, o
  // nada en la gráfica y sólo el listado de abajo.
  const envChangeMarkers = useMemo(() => buildEnvChangeMarkers(envChangeDates), [envChangeDates])

  const yTitle = `Values (${unitLabel})`

  const { yMin, yMax, yTicks } = useMemo(() => {
    const allValues: number[] = []
    for (const point of data) {
      if (point.value != null) allValues.push(point.value)
      if (point.baselineValue != null) allValues.push(point.baselineValue)
    }
    const dataMax = allValues.length > 0 ? Math.max(...allValues) : 0
    const suggestedMax = chartConfig.yAxis?.suggestedMax ?? 20
    const effectiveMax = Math.max(suggestedMax, dataMax)
    const step = effectiveMax <= 10 ? 2 : effectiveMax <= 25 ? 5 : effectiveMax <= 50 ? 10 : effectiveMax <= 100 ? 20 : Math.ceil(effectiveMax / 5 / 10) * 10
    const ceilMax = Math.ceil(effectiveMax / step) * step + step
    const ticks: number[] = []
    for (let v = 0; v <= ceilMax; v += step) ticks.push(v)
    return { yMin: 0, yMax: ceilMax, yTicks: ticks }
  }, [data, chartConfig.yAxis?.suggestedMax])

  const totalDatasetConfig = useMemo<ChartDatasetVisualConfig | null>(() => {
    if (!chartConfig.datasetConfigs) return null
    for (const id of chartConfig.datasets) { const cfg = chartConfig.datasetConfigs[id]; if (cfg?.title?.toLowerCase() === "total") return cfg }
    const firstId = chartConfig.datasets[0]; return firstId ? chartConfig.datasetConfigs[firstId] ?? null : null
  }, [chartConfig])

  const baselineDatasetConfig = useMemo<ChartDatasetVisualConfig | null>(() => {
    if (!chartConfig.datasetConfigs) return null
    for (const id of chartConfig.datasets) { const cfg = chartConfig.datasetConfigs[id]; if (cfg?.title?.toLowerCase() === "baseline") return cfg }
    return null
  }, [chartConfig])

  const lineColor = totalDatasetConfig?.borderColor ?? "#0F172A"
  const baselineColor = baselineDatasetConfig?.borderColor ?? "#DC2626"

  const pointCount = data.length
  const PX_PER_POINT = isAggregated ? 60 : 30
  const needsScroll = pointCount > (isAggregated ? 30 : 60)
  const chartWidth = needsScroll ? pointCount * PX_PER_POINT : undefined
  const chartHeight = 260
  const fontSize = pointCount > 90 ? 8 : pointCount > 30 ? 9 : 10

  const intervalLabel = isAggregated
    ? interval === ChartInterval.WEEKLY ? "Weekly" : interval === ChartInterval.MONTHLY ? "Monthly" : interval === ChartInterval.YEARLY ? "Yearly" : ""
    : ""

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">
            Chart
            {intervalLabel && <span className="ml-1.5 text-xs font-medium text-slate-400">({intervalLabel})</span>}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{yTitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {hasBaselineData && (
            <div className="flex items-center gap-1.5">
              <div className="h-0 w-5 border-t-2 border-dashed" style={{ borderColor: baselineColor }} />
              <span className="text-xs text-slate-500">Baseline</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: lineColor }} />
            <span className="text-xs text-slate-500">Total</span>
          </div>
          {shouldShowEnvChangeLegendChip(envChangeMarkers, environmentalChanges) && (
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-0 border-l-2 border-dashed border-teal-400" />
              <span className="text-xs text-slate-500">Env Changes</span>
            </div>
          )}
        </div>
      </div>

      <div className={needsScroll ? "overflow-x-auto custom-scrollbar" : undefined}>
      <ResponsiveContainer width={chartWidth ?? "100%"} height={chartHeight}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 93%)" vertical={false} />
          <XAxis type="number" dataKey="x" domain={xDomain} ticks={xTicks} tickFormatter={(value: number) => labelByX.get(value) ?? ""} tick={{ fontSize, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} padding={{ left: 30, right: 10 }} interval={0} angle={isAggregated ? 0 : -45} textAnchor={isAggregated ? "middle" : "end"} height={isAggregated ? 40 : 70} />
          <YAxis domain={[yMin, yMax]} ticks={yTicks} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} width={45} type="number" allowDataOverflow />

          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0]?.payload as DurationChartDataPoint | undefined
              return (
                <div className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs space-y-1 max-w-[240px]">
                  <p className="font-semibold">{point?.fullDate ?? label}</p>
                  {point?.baselineValue != null && (
                    <p>Baseline: <span className="font-bold" style={{ color: "#FCA5A5" }}>{point.baselineValue}</span></p>
                  )}
                  {point?.value != null && (
                    <p>Value: <span className="font-bold">{Number.isInteger(point.value) ? point.value : point.value.toFixed(1)}</span> {unitLabel}
                      {point.aggregatedCount != null && point.aggregatedCount > 0 && (
                        <span className="text-slate-400 ml-1">({point.aggregatedCount} session{point.aggregatedCount !== 1 ? "s" : ""})</span>
                      )}
                    </p>
                  )}
                  {point?.hasNote && point.note && (
                    <div className="flex items-start gap-1.5 pt-1 border-t border-slate-700">
                      <div className="h-3 w-0 border-l border-dashed border-teal-400 mt-0.5 shrink-0" />
                      <p className="text-teal-300 italic">{point.note}</p>
                    </div>
                  )}
                </div>
              )
            }}
            cursor={{ stroke: "#037ECC", strokeWidth: 1, strokeDasharray: "4 4" }}
          />

          {hasBaselineData && (
            <Line type="monotone" dataKey="baselineValue" stroke={baselineColor} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4, fill: "white", stroke: baselineColor, strokeWidth: 2 }} activeDot={{ r: 6, fill: baselineColor, stroke: "white", strokeWidth: 2 }} connectNulls={false} />
          )}

          <ReferenceLine y={yMin} stroke="transparent" />
          <ReferenceLine y={yMax} stroke="transparent" />


          {treatmentLineX !== null && (
            <ReferenceLine x={treatmentLineX} stroke="#0F172A" strokeWidth={2}
              label={({ viewBox }: { viewBox: { x?: number; y?: number } }) => {
                const x = viewBox?.x ?? 0; const y = (viewBox?.y ?? 0) + 6
                return (<g><rect x={x - 38} y={y - 14} width={76} height={20} rx={10} fill="#0F172A" /><text x={x} y={y} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600} letterSpacing={0.5}>Treatment</text></g>)
              }}
            />
          )}

          {stoPhases.map((sto) => sto.startLabel !== treatmentDateLabel && xByLabel.has(sto.startLabel) ? (<ReferenceLine key={`sto-start-${sto.number}`} x={xByLabel.get(sto.startLabel)} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6 3" />) : null)}
          {stoPhases.map((sto) => sto.endLabel && xByLabel.has(sto.endLabel) ? (<ReferenceLine key={`sto-end-${sto.number}`} x={xByLabel.get(sto.endLabel)} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6 3" />) : null)}
          {stoPhases.map((sto) => {
            if (!sto.endLabel) return null
            if (!xByLabel.has(sto.startLabel) || !xByLabel.has(sto.endLabel)) return null
            return (<ReferenceArea key={`sto-area-${sto.number}`} x1={xByLabel.get(sto.startLabel)} x2={xByLabel.get(sto.endLabel)} fill="transparent" strokeOpacity={0}
              label={({ viewBox }: { viewBox: { x?: number; y?: number; width?: number; height?: number } }) => {
                const areaX = viewBox?.x ?? 0; const areaW = viewBox?.width ?? 0; const areaH = viewBox?.height ?? 0; const centerX = areaX + areaW / 2; const y = (viewBox?.y ?? 0) + areaH - 10
                return (<text x={centerX} y={y} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight={600}>{`STO#${sto.number}`}</text>)
              }}
            />)
          })}

          {renderEnvChangeMarkers({
            markers: envChangeMarkers,
            display: environmentalChanges,
            resolveX: (dateLabel) => xByLabel.get(dateLabel),
          })}

          <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={pointCount > 60 ? 1.5 : 2.5} dot={pointCount > 30 ? false : { r: 4, fill: "white", stroke: lineColor, strokeWidth: 2 }} activeDot={{ r: 5, fill: lineColor, stroke: "white", strokeWidth: 2 }} connectNulls={totalDatasetConfig?.spanGaps ?? false} />
        </ComposedChart>
      </ResponsiveContainer>
      </div>

      {/* Trend info */}
      <TrendFooter trend={trendInfo} />
    </div>
  )
}
