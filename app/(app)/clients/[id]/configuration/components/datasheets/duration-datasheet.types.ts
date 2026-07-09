import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"

export { getDateKey, parseLocalDate } from "./datasheet-utils"

export interface DurationDayEntry {
  recordings: (number | null)[]
  numberOfRecordings: number
  initials: string
  environmentalNote: string
}

export type DurationWeekEntries = Record<string, DurationDayEntry>

export function createEmptyDurationDayEntry(numberOfRecordings: number): DurationDayEntry {
  return {
    recordings: Array.from({ length: numberOfRecordings }, () => null),
    numberOfRecordings,
    initials: "",
    environmentalNote: "",
  }
}

/** Get filled (non-null) recording values */
export function getFilledRecordings(entry: DurationDayEntry): number[] {
  return entry.recordings.filter((v): v is number => v !== null)
}

/** Calculate daily aggregate based on method (TOTAL = sum, AVERAGE = mean) */
export function calculateDailyAggregate(
  entry: DurationDayEntry,
  method: ServicePlanValueType,
): number | null {
  const filled = getFilledRecordings(entry)
  if (filled.length === 0) return null

  if (method === ServicePlanValueType.TOTAL) {
    return filled.reduce((a, b) => a + b, 0)
  }
  // AVERAGE
  return filled.reduce((a, b) => a + b, 0) / filled.length
}

/** Simple linear regression: returns { slope, intercept } */
export function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  if (points.length < 2) return null

  const n = points.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
  }

  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  return { slope: Math.round(slope * 100) / 100, intercept: Math.round(intercept * 100) / 100 }
}
