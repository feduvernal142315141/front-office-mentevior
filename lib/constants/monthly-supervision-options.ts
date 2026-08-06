/**
 * Valores de `mode`, `structure` y `evaluation` de cada supervisión.
 *
 * ⚠️ El contrato los define como **strings libres** y sólo da un ejemplo de cada
 * uno (`"Face-to-Face"`, `"Individual"`, `"Satisfactory"`). El resto de los
 * valores de acá son una propuesta del front, **pendiente de confirmar con
 * Miriam**: se imprimen tal cual en el PDF, así que no pueden quedar a criterio
 * de quien escribe.
 *
 * Se usan como opciones de un select en vez de texto libre porque un typo en
 * "Satisfactory" termina en un documento clínico. Si backend publica un catálogo
 * —lo pedimos en R7 #5— este archivo se reemplaza por el fetch y nada más.
 *
 * Los valores que lleguen del backend y no estén acá **no se descartan**: el
 * select los agrega para que editar un reporte viejo no cambie lo guardado.
 */

export const SUPERVISION_MODES = ["Face-to-Face", "Remote"] as const

export const SUPERVISION_STRUCTURES = ["Individual", "Group"] as const

export const SUPERVISION_EVALUATIONS = [
  "Satisfactory",
  "Needs Improvement",
  "Unsatisfactory",
] as const

/**
 * Convierte una lista fija en opciones de `FloatingSelect`, agregando el valor
 * actual si el backend devolvió algo fuera de la lista.
 */
export function toSelectOptions(
  values: readonly string[],
  currentValue?: string,
): { value: string; label: string }[] {
  const options = values.map((value) => ({ value, label: value }))

  if (currentValue && !values.includes(currentValue)) {
    options.push({ value: currentValue, label: currentValue })
  }

  return options
}
