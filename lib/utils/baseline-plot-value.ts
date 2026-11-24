/**
 * Valor de un baseline para graficar en la unidad actual del ítem.
 *
 * - Si el backend envía `normalizedValue` (contrato 2026-11-23, opción A), se usa tal cual,
 *   incluido `null`: un valor no convertible no se sustituye por el valor bruto.
 * - Si el campo no viene (backend sin el contrato todavía), se usa `value`.
 */
export function plottedBaselineValue(b: { value?: number | null; normalizedValue?: number | null }): number | null {
  if (b.normalizedValue !== undefined) return b.normalizedValue
  return b.value ?? null
}

/** `true` cuando el backend ya entregó el valor en la unidad actual del ítem */
export function hasNormalizedBaselineValue(b: { normalizedValue?: number | null }): boolean {
  return b.normalizedValue !== undefined
}
