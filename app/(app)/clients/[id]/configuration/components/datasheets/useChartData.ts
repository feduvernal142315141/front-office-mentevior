"use client"

import { useMemo } from "react"
import { eachDayOfInterval, format } from "date-fns"
import type { ChartInterval } from "@/lib/modules/service-plans/constants/chart.constants"
import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import type { ClientServicePlanItemBaseline, ClientServicePlanItemObjective } from "@/lib/types/client-service-plan.types"
import { useClientDataCollectionValues } from "@/lib/modules/client-service-plan/hooks/use-client-data-collection-values"
import {
  aggregateChartData,
  type AggregatedDataPoint,
  type DailyDataPoint,
} from "./aggregate-chart-data"
import { type WeekEntries, getDateKey, parseLocalDate } from "./frequency-datasheet.types"

interface UseChartDataParams {
  clientServicePlanCategoryItemId: string
  chartDays: Date[]
  interval: ChartInterval
  aggregationMethod: ServicePlanValueType
  baselines?: ClientServicePlanItemBaseline[]
  objectives?: ClientServicePlanItemObjective[]
  gridEntries: WeekEntries
}

interface UseChartDataResult {
  aggregatedPoints: AggregatedDataPoint[]
  isLoading: boolean
}

export function useChartData(params: UseChartDataParams): UseChartDataResult {
  const {
    clientServicePlanCategoryItemId,
    chartDays,
    interval,
    aggregationMethod,
    baselines,
    objectives,
    gridEntries,
  } = params

  // Treatment starts at the first STO's startDate
  const treatmentStartDate = useMemo(() => {
    if (!objectives || objectives.length === 0) return null
    const sorted = [...objectives]
      .filter((o) => o.startDate)
      .sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
    if (sorted.length === 0) return null
    return parseLocalDate(sorted[0].startDate)
  }, [objectives])

  // Compute fetch range from chartDays
  const fetchStart = useMemo(() => {
    if (chartDays.length === 0) return ""
    return format(chartDays[0], "yyyy-MM-dd")
  }, [chartDays])

  const fetchEnd = useMemo(() => {
    if (chartDays.length === 0) return ""
    return format(chartDays[chartDays.length - 1], "yyyy-MM-dd")
  }, [chartDays])

  // Fetch DC values for the chart's own range
  const dcValues = useClientDataCollectionValues({
    clientServicePlanCategoryItemId,
    startDate: fetchStart,
    endDate: fetchEnd,
  })

  // Build baseline date set for quick lookup
  const baselineDateKeys = useMemo(() => {
    if (!baselines || baselines.length === 0) return new Set<string>()
    const keys = new Set<string>()
    for (const bl of baselines) {
      if (!bl.date) continue
      keys.add(getDateKey(parseLocalDate(bl.date)))
    }
    return keys
  }, [baselines])

  // Build baseline value map
  const baselineValueMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!baselines) return map
    for (const bl of baselines) {
      if (!bl.date || bl.value == null) continue
      map.set(getDateKey(parseLocalDate(bl.date)), bl.value)
    }
    return map
  }, [baselines])

  // Build DC value map from API response
  const dcValueMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const rec of dcValues.records) {
      map.set(rec.date.slice(0, 10), rec.value)
    }
    return map
  }, [dcValues.records])

  // Merge all data sources into daily points
  const dailyPoints = useMemo<DailyDataPoint[]>(() => {
    // Collect all relevant dates: chartDays + baseline dates
    const allDateKeys = new Set<string>()
    for (const day of chartDays) {
      allDateKeys.add(getDateKey(day))
    }
    for (const key of baselineDateKeys) {
      allDateKeys.add(key)
    }

    const sorted = [...allDateKeys].sort()

    return sorted.map((dateKey) => {
      const isBaselineRecord = baselineDateKeys.has(dateKey)
      // Any date before STO1 startDate is considered part of baseline phase
      const date = parseLocalDate(dateKey)
      const isBeforeTreatment = treatmentStartDate ? date.getTime() < treatmentStartDate.getTime() : false
      const isBaseline = isBaselineRecord || isBeforeTreatment

      // Priority: grid entries (unsaved edits) > API DC values > baseline values
      let value: number | null = null

      if (isBaseline) {
        // For baseline phase: use grid entry if edited, otherwise API baseline or DC value
        const gridEntry = gridEntries[dateKey]
        if (gridEntry !== undefined) {
          value = gridEntry.occurrences
        } else {
          value = baselineValueMap.get(dateKey) ?? dcValueMap.get(dateKey) ?? null
        }
      } else {
        // For treatment phase: use grid entry if edited, otherwise API DC value
        const gridEntry = gridEntries[dateKey]
        if (gridEntry !== undefined && gridEntry.occurrences > 0) {
          value = gridEntry.occurrences
        } else {
          value = dcValueMap.get(dateKey) ?? null
        }
      }

      const note = gridEntries[dateKey]?.environmentalNote

      return { dateKey, value, isBaseline, note }
    })
  }, [chartDays, baselineDateKeys, baselineValueMap, dcValueMap, gridEntries, treatmentStartDate])

  // Aggregate
  const aggregatedPoints = useMemo(
    () => aggregateChartData(dailyPoints, interval, aggregationMethod),
    [dailyPoints, interval, aggregationMethod],
  )

  return {
    aggregatedPoints,
    isLoading: dcValues.isLoading,
  }
}
