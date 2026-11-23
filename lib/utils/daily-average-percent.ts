/**
 * Daily Average % del baseline de Time-sampling (PIR/WIR/MTS).
 * Se guarda como string (el analista puede escribir coma o punto) y es el valor que se grafica.
 */
export function parseDailyAveragePercent(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  const text = String(raw).trim().replace(",", ".")
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

export function isValidDailyAveragePercent(raw: string | number | null | undefined): boolean {
  const n = parseDailyAveragePercent(raw)
  return n !== null && n >= 0 && n <= 100
}

/** Deja solo dígitos y un separador decimal (coma o punto) */
export function sanitizeDailyAveragePercentInput(v: string): string {
  const cleaned = v.replace(/[^0-9.,]/g, "")
  const firstSep = cleaned.search(/[.,]/)
  if (firstSep === -1) return cleaned
  return cleaned.slice(0, firstSep + 1) + cleaned.slice(firstSep + 1).replace(/[.,]/g, "")
}
