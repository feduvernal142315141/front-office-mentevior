import type { ReportMonth } from "@/lib/types/monthly-supervision.types"

/**
 * El período del reporte, en un solo lugar.
 *
 * Hay **tres formatos** dando vueltas para el mismo mes, y ninguno de los dos
 * contratos dice cuál gana en el `POST`:
 *
 * | Dónde | Formato |
 * |---|---|
 * | `GET .../appointments` (query param) | `02/2026` |
 * | `POST` / `PUT` (contrato 2026-08-04) | `"February 2026"` |
 * | Listado y sus filtros (2026-08-05) | `202608` / `Integer_202608` |
 *
 * Adentro del front se usa **siempre `yyyyMM`** —ordenable, comparable y el
 * mismo que el backend guarda y filtra—, y las conversiones a los formatos de
 * cada endpoint viven acá. Si backend confirma que el `POST` espera
 * `"February 2026"`, se cambia `SAVE_FORMAT` y no se toca nada más.
 *
 * Ver §7.0 de `docs/monthly-supervision-backend.md`.
 */

/**
 * Qué formato se manda en `requestedReportDate` al crear/actualizar.
 *
 * `yyyyMM` porque es lo que el backend **guarda y filtra** según el contrato del
 * 2026-08-05: mandar `"February 2026"` arriesga que el registro quede invisible
 * para el filtro del listado.
 */
const SAVE_FORMAT: "yyyyMM" | "monthName" = "yyyyMM"

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export { MONTHS_LONG, MONTHS_SHORT }

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
 * Lee cualquiera de los tres formatos y devuelve `yyyyMM`.
 *
 * Tolerante a propósito: hay registros creados antes de que el backend cambiara
 * el almacenamiento, y no se puede saber cuál de los formatos trae cada uno.
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

/** Valor de `requestedReportDate` para el `POST`/`PUT` */
export function toApiReportDate(value: ReportMonth): string {
  if (SAVE_FORMAT === "monthName") return formatReportMonthLong(value)
  return value
}

/**
 * Valor del query param `monthYear` de
 * `GET /reports/monthly-supervision/appointments`, que el contrato define como
 * `MM/yyyy`.
 */
export function toAppointmentsMonthYear(value: ReportMonth): string {
  const parts = splitReportMonth(value)
  if (!parts) return ""
  return `${String(parts.monthIndex0 + 1).padStart(2, "0")}/${parts.year}`
}

/** Valor numérico para los filtros del listado (`Integer_202608`) */
export function toFilterValue(value: ReportMonth): number {
  return Number(value)
}

/** El mes actual, para arrancar el selector en algo útil */
export function currentReportMonth(): ReportMonth {
  const now = new Date()
  return buildReportMonth(now.getFullYear(), now.getMonth())
}
