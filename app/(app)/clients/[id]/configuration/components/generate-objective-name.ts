import { typeRequiresWeeklyDaily } from "@/lib/modules/service-plans/constants/data-collection.constants"

const OPERATOR_PHRASE: Record<string, string> = {
  GT: "greater than",
  GTE: "greater or equal to",
  EQ: "equal to",
  LT: "less than",
  LTE: "less or equal to",
}

/** Frequency and Rate use integer display; all other types use percentage (%) in the template. */
export function typeUsesIntegerDisplay(typeName: string): boolean {
  return typeRequiresWeeklyDaily(typeName)
}

export interface GenerateObjectiveNameInput {
  index: number
  operatorSmartCriteria: string
  valueSmartCriteria: string
  periodSmartCriteriaCatalogId: string
  valueDuration: string
  periodDurationCatalogId: string
  clientFirstName?: string
  targetName?: string
  periodMap?: Map<string, string>
  dataCollectionTypeName?: string
}

function getPeriodLabel(periodMap: Map<string, string> | undefined, id: string): string {
  return periodMap?.get(id)?.toLowerCase() ?? "period"
}

export function formatCriteriaValueForDisplay(value: number, typeName: string): string {
  if (typeUsesIntegerDisplay(typeName)) {
    return String(Math.round(value))
  }
  const rounded = Math.round(value * 100) / 100
  return `${rounded}%`
}

export function formatCriteriaValueForStorage(value: number, typeName: string): string {
  if (typeUsesIntegerDisplay(typeName)) {
    return String(Math.round(value))
  }
  return String(Math.round(value * 100) / 100)
}

export function buildGeneratedObjectiveName(input: GenerateObjectiveNameInput): string {
  const {
    index,
    operatorSmartCriteria,
    valueSmartCriteria,
    periodSmartCriteriaCatalogId,
    valueDuration,
    periodDurationCatalogId,
    clientFirstName,
    targetName,
    periodMap,
    dataCollectionTypeName = "",
  } = input

  const client = clientFirstName?.trim() || "Client"
  const target = targetName?.trim() || "target behavior"
  const operator = OPERATOR_PHRASE[operatorSmartCriteria] ?? operatorSmartCriteria.toLowerCase()
  const criteriaPeriod = getPeriodLabel(periodMap, periodSmartCriteriaCatalogId)
  const durationPeriod = getPeriodLabel(periodMap, periodDurationCatalogId)

  const numericValue = Number(valueSmartCriteria)
  const criteriaValue = Number.isFinite(numericValue)
    ? formatCriteriaValueForDisplay(numericValue, dataCollectionTypeName)
    : valueSmartCriteria.trim() || "—"
  const durationValue = valueDuration.trim() || "—"

  return `STO#${index}: ${client} will decrease ${target} to ${operator} ${criteriaValue} per ${criteriaPeriod} for ${durationValue} ${durationPeriod}`
}

export function buildGeneratedObjectiveNames(
  quantity: number,
  existingCount: number,
  form: Omit<GenerateObjectiveNameInput, "index">,
  criteriaValues?: number[],
): string[] {
  const count = criteriaValues?.length ?? quantity
  return Array.from({ length: count }, (_, i) =>
    buildGeneratedObjectiveName({
      ...form,
      valueSmartCriteria: String(criteriaValues?.[i] ?? form.valueSmartCriteria),
      index: existingCount + i + 1,
    })
  )
}

export type ObjectiveGenerationMode = "number_of_objectives" | "percentage_from_start_value"

/** Fixed amount per step until End Value or quantity limit (first STO = start - amount). */
function computeNumberOfObjectivesValues(
  start: number,
  end: number,
  quantity: number,
  amount: number,
  isIntegerType: boolean,
): number[] {
  if (quantity <= 0) return []

  const fmt = (v: number) => (isIntegerType ? Math.round(v) : Math.round(v * 100) / 100)

  if (amount <= 0) {
    return Array.from({ length: quantity }, () => fmt(start))
  }

  const values: number[] = []
  let current = start

  while (values.length < quantity && values.length < 50) {
    const raw = current - amount

    // If subtracting goes at or below end, clamp to end and finish
    if (raw <= end) {
      values.push(fmt(end))
      break
    }

    values.push(fmt(raw))
    current = raw
  }

  return values.length > 0 ? values : [fmt(end)]
}

/** Percentage from Start Value: subtract a fixed slice of start until reaching end. */
function computePercentageFromStartValues(
  start: number,
  end: number,
  percentageFromStart: number,
  isIntegerType: boolean,
): number[] {
  if (percentageFromStart <= 0) return [isIntegerType ? Math.round(start) : start]

  const decrement = isIntegerType
    ? Math.round(start * (percentageFromStart / 100))
    : start * (percentageFromStart / 100)

  if (decrement <= 0) return [isIntegerType ? Math.round(start) : start]

  const values: number[] = []
  let current = start

  while (values.length < 50) {
    const next = current - decrement

    if (next <= end) {
      values.push(isIntegerType ? Math.round(end) : end)
      break
    }

    values.push(isIntegerType ? Math.round(next) : Math.round(next * 100) / 100)
    current = next
  }

  return values.length > 0 ? values : [isIntegerType ? Math.round(end) : end]
}

export function computeGeneratedObjectiveCriteriaValues(params: {
  mode: ObjectiveGenerationMode
  quantity: number
  amountToDecreaseIncrease: string
  percentageFromStart: number
  startValue: string
  endValue: string
  dataCollectionTypeName: string
}): number[] {
  const start = Number(params.startValue) || 0
  const end = Number(params.endValue) || 0
  const isIntegerType = typeUsesIntegerDisplay(params.dataCollectionTypeName)

  if (params.mode === "number_of_objectives") {
    const amount = Number(params.amountToDecreaseIncrease) || 0
    return computeNumberOfObjectivesValues(start, end, params.quantity, amount, isIntegerType)
  }

  return computePercentageFromStartValues(
    start,
    end,
    params.percentageFromStart,
    isIntegerType,
  )
}
