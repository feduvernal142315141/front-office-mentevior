/** Mirrors backend `ServicePlanValueType` — used for dailyValue and weeklyValue. */
export enum ServicePlanValueType {
  TOTAL = "TOTAL",
  AVERAGE = "AVERAGE",
}

/** Mirrors backend `ServicePlanUnitOfTime`. */
export enum ServicePlanUnitOfTime {
  SECONDS = "SECONDS",
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
}

const SERVICE_PLAN_VALUE_TYPE_LABELS: Record<ServicePlanValueType, string> = {
  [ServicePlanValueType.TOTAL]: "Total",
  [ServicePlanValueType.AVERAGE]: "Average",
}

const SERVICE_PLAN_UNIT_OF_TIME_LABELS: Record<ServicePlanUnitOfTime, string> = {
  [ServicePlanUnitOfTime.SECONDS]: "Seconds",
  [ServicePlanUnitOfTime.MINUTES]: "Minutes",
  [ServicePlanUnitOfTime.HOURS]: "Hours",
  [ServicePlanUnitOfTime.DAYS]: "Days",
}

export const SERVICE_PLAN_VALUE_TYPE_OPTIONS = Object.values(ServicePlanValueType).map(
  (value) => ({
    value,
    label: SERVICE_PLAN_VALUE_TYPE_LABELS[value],
  })
)

export const SERVICE_PLAN_UNIT_OF_TIME_OPTIONS = Object.values(ServicePlanUnitOfTime).map(
  (value) => ({
    value,
    label: SERVICE_PLAN_UNIT_OF_TIME_LABELS[value],
  })
)

export function parseServicePlanValueType(value: unknown): ServicePlanValueType | undefined {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : ""
  return Object.values(ServicePlanValueType).includes(normalized as ServicePlanValueType)
    ? (normalized as ServicePlanValueType)
    : undefined
}

export function parseServicePlanUnitOfTime(value: unknown): ServicePlanUnitOfTime | undefined {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : ""
  return Object.values(ServicePlanUnitOfTime).includes(normalized as ServicePlanUnitOfTime)
    ? (normalized as ServicePlanUnitOfTime)
    : undefined
}
