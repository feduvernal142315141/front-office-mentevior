import { ServicePlanUnitOfTime } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"

export { getDateKey, parseLocalDate } from "./datasheet-utils"
export type { DayEntry, WeekEntries } from "./frequency-datasheet.types"
export { createEmptyDayEntry } from "./frequency-datasheet.types"

/**
 * Calculate session duration in the given unit from appointment start/end.
 * Returns null if dates are invalid or duration is zero.
 */
export function getSessionDurationInUnit(
  startsAt: string,
  endsAt: string,
  unitOfTime: ServicePlanUnitOfTime,
): number | null {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) return null

  switch (unitOfTime) {
    case ServicePlanUnitOfTime.SECONDS:
      return diffMs / 1000
    case ServicePlanUnitOfTime.MINUTES:
      return diffMs / 1000 / 60
    case ServicePlanUnitOfTime.HOURS:
      return diffMs / 1000 / 60 / 60
    case ServicePlanUnitOfTime.DAYS:
      return diffMs / 1000 / 60 / 60 / 24
    default:
      return diffMs / 1000 / 60 // default to minutes
  }
}

/**
 * Calculate rate = occurrences / session duration.
 * Returns null if duration is invalid or zero.
 */
export function calculateRate(
  occurrences: number,
  startsAt: string,
  endsAt: string,
  unitOfTime: ServicePlanUnitOfTime,
): number | null {
  const duration = getSessionDurationInUnit(startsAt, endsAt, unitOfTime)
  if (duration === null || duration === 0) return null
  return occurrences / duration
}

/**
 * Human-readable label for the unit of time.
 */
export function unitOfTimeLabel(unit: ServicePlanUnitOfTime): string {
  switch (unit) {
    case ServicePlanUnitOfTime.SECONDS: return "sec"
    case ServicePlanUnitOfTime.MINUTES: return "min"
    case ServicePlanUnitOfTime.HOURS: return "hr"
    case ServicePlanUnitOfTime.DAYS: return "day"
    default: return "min"
  }
}
