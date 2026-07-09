/**
 * Shared utilities for all datasheet types.
 */

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Parse an ISO date string (e.g. "2026-06-22T00:00:00.000+00:00") as a local date,
 * ignoring the timezone offset so it doesn't shift to the previous day.
 */
export function parseLocalDate(iso: string): Date {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return new Date(iso)
}
