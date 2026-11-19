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

/** Period catalog name ("Hour", "Minutes"…) → unit of time. Null if it isn't a time unit. */
export function periodNameToUnitOfTime(name?: string | null): ServicePlanUnitOfTime | null {
  const n = (name ?? "").trim().toLowerCase()
  if (n.startsWith("sec")) return ServicePlanUnitOfTime.SECONDS
  if (n.startsWith("min")) return ServicePlanUnitOfTime.MINUTES
  if (n.startsWith("hour") || n === "hr" || n === "hrs") return ServicePlanUnitOfTime.HOURS
  if (n.startsWith("day")) return ServicePlanUnitOfTime.DAYS
  return null
}

/**
 * Manual session duration of each baseline (keyed by YYYY-MM-DD). The baseline always follows
 * the item's Unit of time (the one chosen above in the item), so the duration is already in
 * that unit; the stored Period is not used to convert it. Baselines without a duration are left out.
 */
export function buildBaselineDurationMap(
  baselines: { date: string; sessionDuration?: number | null }[] | undefined,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const b of baselines ?? []) {
    if (!b.date || !b.sessionDuration || b.sessionDuration <= 0) continue
    map.set(getDateKeyLocal(b.date), b.sessionDuration)
  }
  return map
}

function getDateKeyLocal(date: string): string {
  return date.slice(0, 10)
}
