/**
 * Sentido en el que progresa una serie de objetivos: reducir una conducta o adquirir
 * una habilidad.
 *
 * Quién manda, en orden: los valores que escribe el clínico (Start vs End), después el
 * operador del Smart Criteria, y recién al final la categoría como default inicial.
 * Es el mismo criterio de Office Puzzle, donde el wizard deriva los valores de la
 * diferencia entre Start y End, y la categoría es solo una carpeta organizativa.
 */
export type ObjectiveDirection = "decrease" | "increase"

const DECREASING_CATEGORY_IDS = new Set([
  "5dcd1018-1bfc-4fc1-b21c-be69dae55810", // Maladaptive Behaviors
])

/**
 * Default de la categoría, usado solo mientras no haya valores ni operador que definan
 * el sentido. Los ids del catálogo son globales del backend, por eso se pueden fijar
 * acá; el match por nombre cubre el catálogo de fallback local, que usa ids sintéticos
 * (`fallback-*`) cuando `GET /category/catalog` no responde.
 */
export function resolveObjectiveDirection(
  categoryCatalogId?: string | null,
  categoryName?: string | null,
): ObjectiveDirection {
  if (categoryCatalogId && DECREASING_CATEGORY_IDS.has(categoryCatalogId.trim())) {
    return "decrease"
  }
  if (categoryName && categoryName.trim().toLowerCase().includes("maladaptive")) {
    return "decrease"
  }
  return "increase"
}

/** Operador por defecto: reducir apunta a un techo, adquirir apunta a un piso. */
export function defaultOperatorForDirection(direction: ObjectiveDirection): string {
  return direction === "increase" ? "GTE" : "LTE"
}

/**
 * El sentido real de la serie: si el End está por encima del Start la serie sube, y si
 * está por debajo baja. Cuando ambos coinciden no hay sentido implícito y se usa el
 * fallback recibido.
 */
export function resolveDirectionFromValues(
  startValue: number,
  endValue: number,
  fallback: ObjectiveDirection,
): ObjectiveDirection {
  if (endValue > startValue) return "increase"
  if (endValue < startValue) return "decrease"
  return fallback
}

const INCREASING_OPERATORS = new Set(["GT", "GTE"])
const DECREASING_OPERATORS = new Set(["LT", "LTE"])

/**
 * Convención ABA: adquirir se mide por encima del umbral (`>`, `>=`) y reducir por
 * debajo (`<`, `<=`). `=` no define sentido, así que cae al fallback.
 */
export function resolveDirectionFromOperator(
  operator: string | null | undefined,
  fallback: ObjectiveDirection,
): ObjectiveDirection {
  const normalized = operator?.trim().toUpperCase() ?? ""
  if (INCREASING_OPERATORS.has(normalized)) return "increase"
  if (DECREASING_OPERATORS.has(normalized)) return "decrease"
  return fallback
}

/**
 * Cadena completa de precedencia — la única que debe usarse cuando hay valores y
 * operador a la vez: valores (Start vs End) → operador → categoría. Verbo del nombre,
 * operador por defecto y serie de valores salen todos de este mismo resultado.
 */
export function resolveEffectiveDirection(
  startValue: number,
  endValue: number,
  operator: string | null | undefined,
  categoryDirection: ObjectiveDirection,
): ObjectiveDirection {
  return resolveDirectionFromValues(
    startValue,
    endValue,
    resolveDirectionFromOperator(operator, categoryDirection),
  )
}
