/**
 * El backend manda las unidades facturables pegadas al string de billing codes
 * de la session note: `"CPT 97155 (3.67)"`. En Service Details las unidades van
 * junto a las horas, no junto al código, así que hay que separarlas.
 *
 * Ojo: el paréntesis también se usa para el modificador (`"CPT 97153 (XP)"`,
 * ver `formatBillingCodeDisplay`). Por eso sólo se extrae el paréntesis **final**
 * y **numérico**; un modificador queda intacto, y en `"CPT 97153 (XP) (3.67)"`
 * se separan las unidades conservando el modificador.
 */

const TRAILING_UNITS = /\s*\((\d+(?:\.\d+)?)\)\s*$/

export interface BillingCodesWithUnits {
  /** Billing codes sin las unidades, ej. `"CPT 97155"` */
  label: string
  /** Unidades facturables, o `null` si el string no las traía */
  units: number | null
}

export function splitBillingCodesAndUnits(
  raw: string | null | undefined,
): BillingCodesWithUnits {
  if (!raw) return { label: "", units: null }

  const trimmed = raw.trim()
  const match = trimmed.match(TRAILING_UNITS)
  if (!match || match.index === undefined) return { label: trimmed, units: null }

  const units = Number(match[1])
  if (!Number.isFinite(units)) return { label: trimmed, units: null }

  return { label: trimmed.slice(0, match.index).trim(), units }
}

/**
 * "0.92 / 3.67 units" — horas y unidades en una sola celda de Service Details.
 * Si falta alguno de los dos, muestra el que haya; si no hay ninguno, `"—"`.
 */
export function formatHoursAndUnits(
  hours: string | null | undefined,
  units: number | null,
): string {
  const hoursLabel = hours?.trim() || ""
  const unitsLabel = units != null ? `${units} units` : ""

  if (hoursLabel && unitsLabel) return `${hoursLabel} / ${unitsLabel}`
  return hoursLabel || unitsLabel || "—"
}
