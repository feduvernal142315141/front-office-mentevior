import type { HypothesizedFunction } from "@/lib/types/data-collection.types"

/**
 * Etiquetas de la función hipotetizada. Se configura en el item del Client
 * Service Plan (Configuration → Data Collection) y el Assessment la precarga
 * desde ahí, así que las dos pantallas comparten este catálogo.
 */
export const HYPOTHESIZED_FUNCTION_LABELS: Record<HypothesizedFunction, string> = {
  ESCAPE: "Escape",
  ATTENTION: "Attention",
  SENSORY: "Sensory",
  TANGIBLE: "Tangible",
}

export const HYPOTHESIZED_FUNCTION_VALUES = Object.keys(
  HYPOTHESIZED_FUNCTION_LABELS,
) as HypothesizedFunction[]

export const HYPOTHESIZED_FUNCTION_OPTIONS = HYPOTHESIZED_FUNCTION_VALUES.map((value) => ({
  value,
  label: HYPOTHESIZED_FUNCTION_LABELS[value],
}))

/** Los registros previos al contrato 2026-09-03 llegan como `null` o sin la clave */
export function parseHypothesizedFunction(value: unknown): HypothesizedFunction | null {
  return HYPOTHESIZED_FUNCTION_VALUES.find((option) => option === value) ?? null
}

/**
 * Contrato 2026-09-07: la función hipotetizada pasó a ser una lista.
 *
 * Acepta las tres formas que puede llegar a devolver el backend: la lista nueva,
 * el valor suelto de los registros viejos, y la cadena serializada con `;` con la
 * que se persiste —esta última no debería salir por la API, pero cuesta nada
 * cubrirla y evita una pantalla vacía si algún endpoint devuelve la columna cruda.
 * Descarta lo que no sea del enum y no repite valores.
 */
export function parseHypothesizedFunctions(value: unknown): HypothesizedFunction[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(";") : [value]
  const parsed = raw
    .map((entry) => parseHypothesizedFunction(typeof entry === "string" ? entry.trim() : entry))
    .filter((entry): entry is HypothesizedFunction => entry !== null)
  return Array.from(new Set(parsed))
}
