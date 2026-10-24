/** Conservado por compatibilidad con imports existentes. Clinical Monthly usa un solo mes. */
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
 * Misma regla que valida el backend en POST y PUT: Clinical Monthly siempre
 * representa un solo mes calendario. Se comprueba acá para evitar un round-trip.
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

  if (length !== 1) {
    return "Clinical Monthly must use a single calendar month"
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
