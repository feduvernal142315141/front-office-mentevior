import type { ReportMonth } from "@/lib/utils/report-month"
import { buildReportMonth, isReportMonth, splitReportMonth } from "@/lib/utils/report-month"

/**
 * Conversión entre el mes interno del front (`yyyyMM`) y el del API (`MMyyyy`).
 *
 * ⚠️ Los dos formatos tienen **seis dígitos** y son indistinguibles a simple
 * vista: `082026` es agosto de 2026 en `MMyyyy` y un mes inválido (mes 20) en
 * `yyyyMM`. Por eso las conversiones son explícitas y no se resuelven con el
 * parseo tolerante de `lib/utils/report-month.ts`: adivinar acá significaría
 * mostrar el mes equivocado sin que nada falle.
 *
 * `MMyyyy` **no ordena ni compara** por sí solo: enero de 2027 (`012027`) es
 * menor que agosto de 2026 (`082026`) tanto como número como texto. Los filtros
 * de rango funcionan porque el backend **transforma el valor a fecha antes de
 * comparar** —confirmado el 2026-08-08—, no porque el formato lo permita. Es una
 * dependencia real: si esa transformación se cayera, los rangos que cruzan un
 * cambio de año devolverían de menos sin fallar.
 */

/** `MMyyyy`: mes 01–12 seguido de año de 4 dígitos */
const MMYYYY = /^(0[1-9]|1[0-2])(\d{4})$/

/** `"202608"` → `"082026"`; string vacío si el mes interno no es válido */
export function toMonthYearParam(value: ReportMonth): string {
  const parts = splitReportMonth(value)
  if (!parts) return ""
  return `${String(parts.monthIndex0 + 1).padStart(2, "0")}${parts.year}`
}

/**
 * `"082026"` → `"202608"`; `null` si no se puede leer.
 *
 * Acepta también `yyyyMM` por si el backend empieza a devolverlo: un valor que
 * ya está en el formato interno se deja pasar en vez de rechazarse.
 */
export function fromMonthYearParam(value: unknown): ReportMonth | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const raw = String(value).trim()
  if (!raw) return null

  const match = MMYYYY.exec(raw)
  if (match) return buildReportMonth(Number(match[2]), Number(match[1]) - 1)

  return isReportMonth(raw) ? raw : null
}

/**
 * `date` para el `POST`: el backend deriva mes y año, así que se manda el día 1.
 *
 * Se arma con aritmética de strings y no con `new Date()` para no pasar por la
 * zona horaria del navegador: construir la fecha y volver a serializarla mueve
 * el día —y con él el mes— para quien esté al oeste de UTC.
 */
export function toReportDate(value: ReportMonth): string {
  const parts = splitReportMonth(value)
  if (!parts) return ""
  return `${parts.year}-${String(parts.monthIndex0 + 1).padStart(2, "0")}-01`
}
