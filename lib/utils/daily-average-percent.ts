/**
 * Daily Average % del baseline de Time-sampling (PIR/WIR/MTS).
 *
 * Contrato backend (2026-11-23): string JSON, rango 0–100, 1 a 3 cifras enteras y hasta 2
 * decimales separados por coma o punto, máximo 6 caracteres. Se envía tal cual lo escribió el analista.
 */

const DAILY_AVERAGE_PERCENT_PATTERN = /^\d{1,3}([.,]\d{1,2})?$/
const DAILY_AVERAGE_PERCENT_MAX_LENGTH = 6

/** Valor numérico del porcentaje, o null si el texto no cumple el contrato */
export function parseDailyAveragePercent(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  const text = String(raw).trim()
  if (!DAILY_AVERAGE_PERCENT_PATTERN.test(text) || text.length > DAILY_AVERAGE_PERCENT_MAX_LENGTH) return null
  const n = Number(text.replace(",", "."))
  return n >= 0 && n <= 100 ? n : null
}

export function isValidDailyAveragePercent(raw: string | number | null | undefined): boolean {
  return parseDailyAveragePercent(raw) !== null
}

/**
 * Limita la entrada mientras se escribe: hasta 3 cifras enteras, un separador (coma o punto),
 * hasta 2 decimales y 6 caracteres. Nunca produce un texto que el contrato rechace por formato.
 */
export function sanitizeDailyAveragePercentInput(v: string): string {
  let out = ""
  let hasSeparator = false
  let integerDigits = 0
  let decimalDigits = 0
  for (const ch of v) {
    if (ch >= "0" && ch <= "9") {
      if (hasSeparator) {
        if (decimalDigits >= 2) continue
        decimalDigits++
      } else {
        if (integerDigits >= 3) continue
        integerDigits++
      }
      out += ch
    } else if ((ch === "," || ch === ".") && !hasSeparator && integerDigits > 0) {
      hasSeparator = true
      out += ch
    }
  }
  return out.slice(0, DAILY_AVERAGE_PERCENT_MAX_LENGTH)
}

/**
 * Un baseline necesita enviar su porcentaje cuando es nuevo o cuando el analista lo cambió.
 * Un baseline guardado que no se tocó no se reenvía: el backend conservaría su origen actual.
 */
export function isDailyAveragePercentPending(row: {
  recordId?: string
  dailyAveragePercent?: string
  loadedDailyAveragePercent?: string
}): boolean {
  if (!row.recordId) return true
  return (row.dailyAveragePercent ?? "").trim() !== (row.loadedDailyAveragePercent ?? "").trim()
}
