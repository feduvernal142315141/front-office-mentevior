/** El backend acota el reporte a 12 meses */
export const MAX_MONTH_RANGE = 12

const MONTH_YEAR_PATTERN = /^(0[1-9]|1[0-2])\/\d{4}$/

export function isValidMonthYear(value: string): boolean {
  return MONTH_YEAR_PATTERN.test(value.trim())
}

/** `MM/yyyy` → número comparable de meses; -1 si el formato no sirve */
function toMonthIndex(monthYear: string): number {
  if (!isValidMonthYear(monthYear)) return -1
  const [month, year] = monthYear.trim().split("/")
  return Number(year) * 12 + (Number(month) - 1)
}

/** Cantidad de meses del rango, ambos extremos incluidos. 0 si el rango no sirve */
export function monthRangeLength(startMonthYear: string, endMonthYear: string): number {
  const start = toMonthIndex(startMonthYear)
  const end = toMonthIndex(endMonthYear)
  if (start < 0 || end < 0 || end < start) return 0
  return end - start + 1
}

/**
 * Mismas reglas que valida el backend en POST y PUT. Se comprueban acá para no
 * gastar un round-trip y poder marcar el campo exacto en el formulario.
 * Devuelve null si todo está bien.
 */
export function validateMonthRange(startMonthYear: string, endMonthYear: string): string | null {
  if (!startMonthYear || !isValidMonthYear(startMonthYear)) {
    return "Start month is required in MM/yyyy format"
  }
  if (!endMonthYear || !isValidMonthYear(endMonthYear)) {
    return "End month is required in MM/yyyy format"
  }

  const length = monthRangeLength(startMonthYear, endMonthYear)

  if (length === 0) {
    return "End month must be the same as or later than the start month"
  }
  if (length > MAX_MONTH_RANGE) {
    return `The range cannot exceed ${MAX_MONTH_RANGE} months`
  }

  return null
}

/** Meses del rango, en el mismo formato `yyyy-MM` que usa `months[].key` del detalle */
export function listMonthKeys(startMonthYear: string, endMonthYear: string): string[] {
  const length = monthRangeLength(startMonthYear, endMonthYear)
  if (length === 0) return []

  const [startMonth, startYear] = startMonthYear.trim().split("/").map(Number)
  const keys: string[] = []

  for (let i = 0; i < length; i++) {
    const monthIndex = startMonth - 1 + i
    const year = startYear + Math.floor(monthIndex / 12)
    const month = (monthIndex % 12) + 1
    keys.push(`${year}-${String(month).padStart(2, "0")}`)
  }

  return keys
}
