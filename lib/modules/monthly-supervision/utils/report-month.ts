import type { ReportMonth } from "@/lib/utils/report-month"
import { formatReportMonthLong, splitReportMonth } from "@/lib/utils/report-month"

/**
 * El período del reporte de Monthly Supervision.
 *
 * Las primitivas puras viven en `lib/utils/report-month.ts` y se re-exportan acá
 * para no romper a quien ya importaba desde este módulo. Lo propio de Monthly
 * Supervision es sólo la conversión a los formatos de SUS endpoints.
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
 * Ver §7.0 de `docs/monthly-supervision-backend.md`.
 */

export type { ReportMonth }
export {
  MONTHS_LONG,
  MONTHS_SHORT,
  buildReportMonth,
  currentReportMonth,
  formatReportMonthLong,
  isReportMonth,
  parseReportMonth,
  splitReportMonth,
} from "@/lib/utils/report-month"

/**
 * Qué formato se manda en `requestedReportDate` al crear/actualizar.
 *
 * `yyyyMM` porque es lo que el backend **guarda y filtra** según el contrato del
 * 2026-08-05: mandar `"February 2026"` arriesga que el registro quede invisible
 * para el filtro del listado.
 */
const SAVE_FORMAT: "yyyyMM" | "monthName" = "yyyyMM"

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
