import type { HypothesizedFunction } from "@/lib/types/data-collection.types"

/**
 * Etiquetas de la función hipotetizada. Se configura en el item del Client
 * Service Plan (Configuration → Data Collection) y el Assessment la muestra en
 * sólo lectura, así que las dos pantallas comparten este catálogo.
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
