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

/**
 * Frequency-like types (Frequency, Frequency/Count). Gate for intensity fields
 * in the Assessment: the backend only prints intensity for these items.
 */
export function typeIsFrequency(typeName: string): boolean {
  const normalized = normalizeTypeName(typeName)
  return normalized === "frequency" || normalized === "frequency/count"
}

export function typeRequiresWeeklyDaily(typeName: string): boolean {
  return typeName === "Frequency" || typeName === "Frequency/Count" || typeName === "Rate"
}

export function typeRequiresUnitOfTime(typeName: string): boolean {
  return typeName === "Rate"
}

/**
 * Rate: el baseline es una colección independiente (no hay cita agendada al
 * armar el service plan), así que el analista carga a mano la duración de esa sesión.
 * Duration no la pide: su valor ya está expresado en la unidad de tiempo.
 */
export function typeRequiresBaselineSessionDuration(typeName: string): boolean {
  return typeName === "Rate"
}

function typeIsLatency(typeName: string): boolean {
  return typeName === "Latency" || typeName === "Response latency"
}

/** Rate, Duration y Latency: el baseline usa la Unit of time del item en lugar del Period. */
export function typeUsesItemUnitInBaseline(typeName: string): boolean {
  return typeName === "Rate" || typeName === "Duration" || typeIsLatency(typeName)
}

/** Duration y Latency no muestran ni exigen "Suggested number of recordings" (se conserva el valor por defecto). */
export function typeShowsSuggestedRecordings(typeName: string): boolean {
  return typeName !== "Duration" && !typeIsLatency(typeName)
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
    typeName === "Latency" ||
    typeName === "Interresponse time" ||
    typeName === "Interresponse Time"
  )
}

export function typeHasCumulativeValueToggles(typeGroup: string): boolean {
  return typeGroup === "Time-sampling"
}

export function typeHasLevels(typeId: string): boolean {
  return typeId !== ""
}
