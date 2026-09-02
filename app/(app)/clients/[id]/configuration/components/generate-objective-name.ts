import {
  typeRequiresDailyAndWeekly,
  typeRequiresWeeklyDaily,
} from "@/lib/modules/service-plans/constants/data-collection.constants"
import {
  resolveDirectionFromOperator,
  type ObjectiveDirection,
} from "@/lib/modules/service-plans/constants/objective-direction"

/** Frequency and Rate use integer display; all other types use decimals in the template. */
export function typeUsesIntegerDisplay(typeName: string): boolean {
  return typeRequiresWeeklyDaily(typeName)
}

/**
 * Unidad del criterio según el tipo de medición: Frequency/Rate cuentan ocurrencias,
 * Duration/Latency/IRT se miden en tiempo y el resto (Percentage, Trials, intervalos)
 * en porcentaje.
 */
export type CriteriaUnitKind = "occurrences" | "time" | "percent"

export function resolveCriteriaUnitKind(typeName: string): CriteriaUnitKind {
  if (typeRequiresWeeklyDaily(typeName)) return "occurrences"
  if (typeRequiresDailyAndWeekly(typeName)) return "time"
  return "percent"
}

const UNIT_OF_TIME_NOUNS: Record<string, string> = {
  SECONDS: "second",
  MINUTES: "minute",
  HOURS: "hour",
  DAYS: "day",
}

function unitOfTimeNoun(unitOfTime: string | undefined): string {
  return UNIT_OF_TIME_NOUNS[unitOfTime?.trim().toUpperCase() ?? ""] ?? "minute"
}

function formatCriteriaNumber(value: number, typeName: string): string {
  if (typeUsesIntegerDisplay(typeName)) return String(Math.round(value))
  return String(Math.round(value * 100) / 100)
}

const UNIT_OF_TIME_ABBREVIATIONS: Record<string, string> = {
  SECONDS: "sec",
  MINUTES: "min",
  HOURS: "hr",
  DAYS: "day",
}

/** Valor compacto para chips de preview: "10", "40%", "5 min". */
export function formatCriteriaChipValue(
  value: number,
  typeName: string,
  unitOfTime?: string,
): string {
  const kind = resolveCriteriaUnitKind(typeName)
  const display = formatCriteriaNumber(value, typeName)
  if (kind === "percent") return `${display}%`
  if (kind === "time") {
    return `${display} ${UNIT_OF_TIME_ABBREVIATIONS[unitOfTime?.trim().toUpperCase() ?? ""] ?? "min"}`
  }
  return display
}

function valueWithUnit(value: number, typeName: string, unitOfTime?: string): string {
  const kind = resolveCriteriaUnitKind(typeName)
  const display = formatCriteriaNumber(value, typeName)
  if (kind === "percent") return `${display}%`
  const noun = kind === "occurrences" ? "occurrence" : unitOfTimeNoun(unitOfTime)
  return `${display} ${Number(display) === 1 ? noun : `${noun}s`}`
}

/**
 * Frase natural del criterio: en ABA la meta se redacta como tope o piso
 * ("4 or fewer occurrences", "80% or more"), no con el operador matemático crudo.
 * "fewer" para conteos, "less" para porcentaje y tiempo.
 */
export function buildCriteriaPhrase(
  operator: string,
  value: number,
  typeName: string,
  unitOfTime?: string,
): string {
  const withUnit = valueWithUnit(value, typeName, unitOfTime)
  const less = resolveCriteriaUnitKind(typeName) === "occurrences" ? "fewer" : "less"
  switch (operator?.trim().toUpperCase()) {
    case "GTE": return `${withUnit} or more`
    case "GT": return `more than ${withUnit}`
    case "LTE": return `${withUnit} or ${less}`
    case "LT": return `${less} than ${withUnit}`
    case "EQ": return `exactly ${withUnit}`
    default: return withUnit
  }
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
  /** Sentido efectivo de la serie (valores → operador → categoría); manda sobre el verbo */
  direction?: ObjectiveDirection
  /** Start Value de la serie; en reducción se redacta como "from a baseline of X" */
  baselineValue?: string
  /** ServicePlanUnitOfTime del item (SECONDS/MINUTES/…), para tipos de duración */
  unitOfTime?: string
}

export function objectiveVerbForDirection(direction: ObjectiveDirection | undefined): string {
  return direction === "increase" ? "increase" : "reduce"
}

function getPeriodLabel(periodMap: Map<string, string> | undefined, id: string): string {
  return periodMap?.get(id)?.toLowerCase() ?? "period"
}

export function formatCriteriaValueForStorage(value: number, typeName: string): string {
  if (typeUsesIntegerDisplay(typeName)) {
    return String(Math.round(value))
  }
  return String(Math.round(value * 100) / 100)
}

/** Recupera el baseline de un nombre ya generado, para no perderlo al re-redactar. */
export function extractBaselineFromName(name: string): string | undefined {
  const match = name.match(/from a baseline of (\d+(?:\.\d+)?)%?/)
  return match?.[1]
}

/**
 * Cuerpo común de la redacción: "{Client} will {verb} {target}[ from a baseline of X]
 * to {criteria phrase} per {period} for {N} consecutive {periods}."
 */
function buildObjectiveSentence(input: Omit<GenerateObjectiveNameInput, "index">): string {
  const {
    operatorSmartCriteria,
    valueSmartCriteria,
    periodSmartCriteriaCatalogId,
    valueDuration,
    periodDurationCatalogId,
    clientFirstName,
    targetName,
    periodMap,
    dataCollectionTypeName = "",
    direction,
    baselineValue,
    unitOfTime,
  } = input

  const client = clientFirstName?.trim() || "Client"
  const target = targetName?.trim() || "target behavior"
  const criteriaPeriod = getPeriodLabel(periodMap, periodSmartCriteriaCatalogId)
  const durationPeriod = getPeriodLabel(periodMap, periodDurationCatalogId)

  const numericValue = Number(valueSmartCriteria)
  const criteriaPhrase = Number.isFinite(numericValue)
    ? buildCriteriaPhrase(operatorSmartCriteria, numericValue, dataCollectionTypeName, unitOfTime)
    : valueSmartCriteria.trim() || "—"
  const durationValue = valueDuration.trim() || "—"

  // Pluralize duration period (e.g. "week" → "weeks")
  const durationNum = Number(durationValue)
  const pluralDurationPeriod = durationNum !== 1 ? `${durationPeriod}s` : durationPeriod

  const resolvedDirection: ObjectiveDirection =
    direction ?? resolveDirectionFromOperator(operatorSmartCriteria, "decrease")
  const verb = objectiveVerbForDirection(resolvedDirection)

  // Convención ABA: la reducción se redacta desde el baseline hacia el tope
  const baselineNumber = Number(baselineValue)
  const baselineClause =
    resolvedDirection === "decrease" && baselineValue && Number.isFinite(baselineNumber)
      ? ` from a baseline of ${formatCriteriaNumber(baselineNumber, dataCollectionTypeName)}${
          resolveCriteriaUnitKind(dataCollectionTypeName) === "percent" ? "%" : ""
        }`
      : ""

  return `${client} will ${verb} ${target}${baselineClause} to ${criteriaPhrase} per ${criteriaPeriod} for ${durationValue} consecutive ${pluralDurationPeriod}.`
}

export function buildGeneratedObjectiveName(input: GenerateObjectiveNameInput): string {
  return `STO#${input.index}: ${buildObjectiveSentence(input)}`
}

/** Nombre de un objetivo de Mastery criteria, con la misma redacción que los STO. */
export function buildMasteryObjectiveName(
  input: Omit<GenerateObjectiveNameInput, "index">,
): string {
  return `Mastery criteria: ${buildObjectiveSentence(input)}`
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

/** Tope de STOs por serie. En ABA lo habitual son 3–10; 50 es el techo duro. */
export const MAX_GENERATED_OBJECTIVES = 50

/**
 * Cuántos pasos caben realmente entre Start y End: nunca más que el tope, y con pasos
 * enteros tampoco más que unidades tenga el rango.
 */
export function clampObjectiveQuantity(quantity: number, range: number): number {
  const capped = Math.min(Math.max(Math.round(quantity), 0), MAX_GENERATED_OBJECTIVES)
  if (range <= 0 || capped === 0) return capped
  return Math.min(capped, Math.max(1, Math.ceil(range)))
}

/** Paso necesario para que `quantity` objetivos cubran todo el rango. */
export function suggestAmountForQuantity(range: number, quantity: number): number {
  if (range <= 0 || quantity <= 0) return 0
  return Math.max(1, Math.round(range / quantity))
}

/** Cuántos objetivos hacen falta para cubrir el rango con ese paso, ya topeados. */
export function suggestQuantityForAmount(range: number, amount: number): number {
  if (range <= 0 || amount <= 0) return 0
  return clampObjectiveQuantity(Math.ceil(range / amount), range)
}

/** Alcanzó el End Value: hacia abajo se pasa por debajo, hacia arriba por encima. */
function reachesEnd(value: number, end: number, direction: ObjectiveDirection): boolean {
  return direction === "increase" ? value >= end : value <= end
}

/**
 * El último STO de la serie siempre es la meta. Sin esto, el redondeo del paso o el tope
 * de objetivos dejaban la serie cortada a mitad de camino sin ningún aviso.
 */
function closeSeriesOnEnd(values: number[], end: number): number[] {
  if (values.length === 0) return [end]
  if (values[values.length - 1] !== end) values[values.length - 1] = end
  return values
}

/** Fixed amount per step until End Value or quantity limit (first STO = start ± amount). */
function computeNumberOfObjectivesValues(
  start: number,
  end: number,
  quantity: number,
  amount: number,
  isIntegerType: boolean,
  direction: ObjectiveDirection,
): number[] {
  // Sin cantidad, sin paso o sin recorrido no hay serie: preview vacío en vez de
  // N copias del Start Value (la validación bloquea igual estos casos al guardar)
  if (quantity <= 0 || amount <= 0 || start === end) return []

  const fmt = (v: number) => (isIntegerType ? Math.round(v) : Math.round(v * 100) / 100)

  const step = direction === "increase" ? Math.abs(amount) : -Math.abs(amount)

  const values: number[] = []
  let current = start

  while (values.length < quantity && values.length < MAX_GENERATED_OBJECTIVES) {
    const raw = current + step

    if (reachesEnd(raw, end, direction)) {
      values.push(fmt(end))
      break
    }

    values.push(fmt(raw))
    current = raw
  }

  return closeSeriesOnEnd(values, fmt(end))
}

/**
 * Percentage from Start Value: avanza una tajada fija hasta llegar al end.
 * Al reducir la tajada sale del Start Value; al adquirir, el start suele ser 0 y no
 * daría ningún paso, así que la tajada se toma sobre el End Value (la meta).
 */
function computePercentageFromStartValues(
  start: number,
  end: number,
  percentageFromStart: number,
  isIntegerType: boolean,
  direction: ObjectiveDirection,
): number[] {
  // Igual que en el modo por cantidad: entradas inválidas dan preview vacío
  if (percentageFromStart <= 0 || start === end) return []

  const base = direction === "increase" ? Math.abs(end) : Math.abs(start)
  const rawStep = base * (percentageFromStart / 100)
  const stepMagnitude = isIntegerType ? Math.round(rawStep) : rawStep

  if (stepMagnitude <= 0) return []

  const step = direction === "increase" ? stepMagnitude : -stepMagnitude

  const values: number[] = []
  let current = start

  while (values.length < MAX_GENERATED_OBJECTIVES) {
    const next = current + step

    if (reachesEnd(next, end, direction)) {
      values.push(isIntegerType ? Math.round(end) : end)
      break
    }

    values.push(isIntegerType ? Math.round(next) : Math.round(next * 100) / 100)
    current = next
  }

  return closeSeriesOnEnd(values, isIntegerType ? Math.round(end) : end)
}

export function computeGeneratedObjectiveCriteriaValues(params: {
  mode: ObjectiveGenerationMode
  quantity: number
  amountToDecreaseIncrease: string
  percentageFromStart: number
  startValue: string
  endValue: string
  dataCollectionTypeName: string
  direction: ObjectiveDirection
}): number[] {
  const start = Number(params.startValue) || 0
  const end = Number(params.endValue) || 0
  const isIntegerType = typeUsesIntegerDisplay(params.dataCollectionTypeName)

  if (params.mode === "number_of_objectives") {
    const amount = Number(params.amountToDecreaseIncrease) || 0
    return computeNumberOfObjectivesValues(
      start,
      end,
      params.quantity,
      amount,
      isIntegerType,
      params.direction,
    )
  }

  return computePercentageFromStartValues(
    start,
    end,
    params.percentageFromStart,
    isIntegerType,
    params.direction,
  )
}
