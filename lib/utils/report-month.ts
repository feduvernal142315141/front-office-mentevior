/**
 * El mes de un reporte, en un solo lugar.
 *
 * **Adentro del front el mes se representa siempre como `yyyyMM`.** Es el único
 * de los formatos dando vueltas que ordena y compara solo: `202601` < `202608`
 * tanto como número como texto. Cada módulo convierte al formato que pide su
 * endpoint en su propio `utils`, y esa conversión vive en un solo archivo por
 * módulo para que un cambio de contrato sea una línea.
 *
 * Acá viven únicamente las primitivas puras —parseo, split, formato— que no
 * dependen de ningún endpoint. Las usan Monthly Supervision y Case Supervision
 * Log, y el `MonthPicker` compartido.
 */

/** Período de un reporte en el formato interno del front: `yyyyMM` */
export type ReportMonth = string

export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** `yyyyMM` válido: año de 4 dígitos y mes 01–12 */
const YYYYMM = /^(\d{4})(0[1-9]|1[0-2])$/

export function isReportMonth(value: string): boolean {
  return YYYYMM.test(value.trim())
}

export function buildReportMonth(year: number, monthIndex0: number): ReportMonth {
  return `${year}${String(monthIndex0 + 1).padStart(2, "0")}`
}

/** `"202602"` → `{ year: 2026, monthIndex0: 1 }`; `null` si no se puede leer */
export function splitReportMonth(value?: string | null): { year: number; monthIndex0: number } | null {
  const parsed = parseReportMonth(value)
  if (!parsed) return null
  return { year: Number(parsed.slice(0, 4)), monthIndex0: Number(parsed.slice(4)) - 1 }
}

/**
 * Lee cualquiera de los formatos que circulan y devuelve `yyyyMM`.
 *
 * Tolerante a propósito: hay registros creados antes de que el backend cambiara
 * el almacenamiento, y no se puede saber cuál de los formatos trae cada uno.
 *
 * ⚠️ `MMyyyy` (el de Case Supervision Log) **no se resuelve acá**: es ambiguo
 * contra `yyyyMM` —`082026` se puede leer de las dos formas— así que su
 * conversión es explícita y vive en el módulo que la necesita.
 */
export function parseReportMonth(value?: string | null): ReportMonth | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null

  // yyyyMM
  if (YYYYMM.test(raw)) return raw

  // MM/yyyy
  const slash = /^(0?[1-9]|1[0-2])\/(\d{4})$/.exec(raw)
  if (slash) return buildReportMonth(Number(slash[2]), Number(slash[1]) - 1)

  // "February 2026" / "Feb 2026"
  const named = /^([A-Za-z]+)\s+(\d{4})$/.exec(raw)
  if (named) {
    const needle = named[1].toLowerCase()
    const index = MONTHS_LONG.findIndex(
      (month, i) => month.toLowerCase() === needle || MONTHS_SHORT[i].toLowerCase() === needle,
    )
    if (index >= 0) return buildReportMonth(Number(named[2]), index)
  }

  return null
}

/** `"202602"` → `"February 2026"`; devuelve `"—"` si no se puede leer */
export function formatReportMonthLong(value?: string | null): string {
  const parts = splitReportMonth(value)
  if (!parts) return "—"
  return `${MONTHS_LONG[parts.monthIndex0]} ${parts.year}`
}

/** `"202602"` → `"02/2026"`; string vacío si no se puede leer */
export function formatReportMonthShort(value?: string | null): string {
  const parts = splitReportMonth(value)
  if (!parts) return ""
  return `${String(parts.monthIndex0 + 1).padStart(2, "0")}/${parts.year}`
}

/** El mes actual, para arrancar los selectores en algo útil */
export function currentReportMonth(): ReportMonth {
  const now = new Date()
  return buildReportMonth(now.getFullYear(), now.getMonth())
}
