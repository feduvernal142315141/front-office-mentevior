export {
  SERVICE_PLAN_VALUE_TYPE_OPTIONS,
  SERVICE_PLAN_UNIT_OF_TIME_OPTIONS,
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"

/** @deprecated Use SERVICE_PLAN_VALUE_TYPE_OPTIONS */
export { SERVICE_PLAN_VALUE_TYPE_OPTIONS as WEEKLY_DAILY_OPTIONS } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"

/** @deprecated Use SERVICE_PLAN_UNIT_OF_TIME_OPTIONS */
export { SERVICE_PLAN_UNIT_OF_TIME_OPTIONS as UNIT_OF_TIME_OPTIONS } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"

// --- Helper functions: which fields are shown per type ---
// These receive the resolved `name` or `group` from the catalog, not the UUID.

function normalizeTypeName(typeName: string): string {
  return typeName.trim().toLowerCase()
}

export function typeIsMeasurementLog(typeName: string): boolean {
  return normalizeTypeName(typeName) === "measurement log"
}

export function typeRequiresWeeklyDaily(typeName: string): boolean {
  return typeName === "Frequency" || typeName === "Rate"
}

export function typeRequiresUnitOfTime(typeName: string): boolean {
  return typeName === "Rate"
}

export function typeRequiresInterval(typeGroup: string): boolean {
  return typeGroup === "Time-sampling"
}

/**
 * Duration-like types render Unit of time + Suggested recordings + Daily + Weekly value.
 * Includes Duration, Response latency and Interresponse time.
 */
export function typeRequiresDailyAndWeekly(typeName: string): boolean {
  return (
    typeName === "Duration" ||
    typeName === "Response latency" ||
    typeName === "Interresponse time"
  )
}

export function typeHasCumulativeValueToggles(typeGroup: string): boolean {
  return typeGroup === "Time-sampling"
}

export function typeHasLevels(typeId: string): boolean {
  return typeId !== ""
}
