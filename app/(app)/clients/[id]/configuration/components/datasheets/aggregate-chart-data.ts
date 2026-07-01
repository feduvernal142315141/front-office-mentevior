import { startOfWeek, format } from "date-fns"
import type { ChartInterval } from "@/lib/modules/service-plans/constants/chart.constants"
import type { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DailyDataPoint {
  dateKey: string       // "YYYY-MM-DD"
  value: number | null  // null = no data that day
  isBaseline: boolean
  note?: string
}

export interface AggregatedDataPoint {
  periodKey: string
  periodLabel: string
  periodStart: Date
  value: number | null
  baselineValue: number | null
  count: number
  isBaseline: boolean
  dailyPoints: DailyDataPoint[]
  hasNote: boolean
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export function aggregateChartData(
  dailyPoints: DailyDataPoint[],
  interval: ChartInterval,
  aggregationMethod: ServicePlanValueType,
): AggregatedDataPoint[] {
  if (interval === "DAILY" || interval === "SESSION") {
    return dailyPoints.map((p) => {
      const date = parseDateKey(p.dateKey)
      return {
        periodKey: p.dateKey,
        periodLabel: format(date, "MM/dd"),
        periodStart: date,
        value: p.isBaseline ? null : p.value,
        baselineValue: p.isBaseline ? p.value : null,
        count: p.value !== null ? 1 : 0,
        isBaseline: p.isBaseline,
        dailyPoints: [p],
        hasNote: !!p.note?.trim(),
      }
    })
  }

  // Group daily points by period
  const groups = new Map<string, DailyDataPoint[]>()
  const periodMeta = new Map<string, { label: string; start: Date }>()

  for (const point of dailyPoints) {
    const date = parseDateKey(point.dateKey)
    const { key, label, start } = getPeriodInfo(date, interval)

    if (!groups.has(key)) {
      groups.set(key, [])
      periodMeta.set(key, { label, start })
    }
    groups.get(key)!.push(point)
  }

  // Sort periods chronologically
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    const startA = periodMeta.get(a)!.start.getTime()
    const startB = periodMeta.get(b)!.start.getTime()
    return startA - startB
  })

  return sortedKeys.map((key) => {
    const points = groups.get(key)!
    const meta = periodMeta.get(key)!

    const baselinePoints = points.filter((p) => p.isBaseline && p.value !== null)
    const treatmentPoints = points.filter((p) => !p.isBaseline && p.value !== null)
    const hasBaseline = baselinePoints.length > 0
    const hasTreatment = treatmentPoints.length > 0
    const hasNote = points.some((p) => !!p.note?.trim())

    // Aggregate baseline values
    let baselineValue: number | null = null
    if (hasBaseline) {
      baselineValue = aggregate(
        baselinePoints.map((p) => p.value!),
        aggregationMethod,
      )
    }

    // Aggregate treatment values
    let value: number | null = null
    if (hasTreatment) {
      value = aggregate(
        treatmentPoints.map((p) => p.value!),
        aggregationMethod,
      )
    }

    return {
      periodKey: key,
      periodLabel: meta.label,
      periodStart: meta.start,
      value,
      baselineValue,
      count: treatmentPoints.length + baselinePoints.length,
      isBaseline: hasBaseline && !hasTreatment,
      dailyPoints: points,
      hasNote,
    }
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function aggregate(values: number[], method: ServicePlanValueType): number {
  if (values.length === 0) return 0
  const sum = values.reduce((a, b) => a + b, 0)
  return method === "AVERAGE" ? sum / values.length : sum
}

function getPeriodInfo(
  date: Date,
  interval: ChartInterval,
): { key: string; label: string; start: Date } {
  switch (interval) {
    case "WEEKLY": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      return {
        key: format(weekStart, "yyyy-MM-dd"),
        label: `Wk ${format(weekStart, "MM/dd")}`,
        start: weekStart,
      }
    }
    case "MONTHLY": {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      return {
        key: format(date, "yyyy-MM"),
        label: format(date, "MMM yyyy"),
        start: monthStart,
      }
    }
    case "YEARLY": {
      const yearStart = new Date(date.getFullYear(), 0, 1)
      return {
        key: format(date, "yyyy"),
        label: format(date, "yyyy"),
        start: yearStart,
      }
    }
    case "QUARTERLY": {
      const quarter = Math.floor(date.getMonth() / 3)
      const quarterStart = new Date(date.getFullYear(), quarter * 3, 1)
      return {
        key: `${date.getFullYear()}-Q${quarter + 1}`,
        label: `Q${quarter + 1} ${date.getFullYear()}`,
        start: quarterStart,
      }
    }
    default:
      return {
        key: format(date, "yyyy-MM-dd"),
        label: format(date, "MM/dd"),
        start: date,
      }
  }
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Maps a raw date to the period label it belongs to, for phase line snapping.
 */
export function dateToPeriodLabel(date: Date, interval: ChartInterval): string {
  if (interval === "DAILY" || interval === "SESSION") {
    return format(date, "MM/dd")
  }
  return getPeriodInfo(date, interval).label
}
