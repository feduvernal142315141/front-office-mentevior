export { getDateKey, parseLocalDate } from "./datasheet-utils"

export type IntervalValue = "+" | "-" | null

export interface IntervalDayEntry {
  intervals: IntervalValue[]
  numberOfIntervals: number
  initials: string
  environmentalNote: string
}

export type IntervalWeekEntries = Record<string, IntervalDayEntry>

export function createEmptyIntervalDayEntry(numberOfIntervals: number): IntervalDayEntry {
  return {
    intervals: Array.from({ length: numberOfIntervals }, () => null),
    numberOfIntervals,
    initials: "",
    environmentalNote: "",
  }
}

/** Count of intervals with "+" (occurrence) */
export function countPositive(entry: IntervalDayEntry): number {
  return entry.intervals.filter((v) => v === "+").length
}

/** Count of intervals that have been answered (+ or -) */
export function countAnswered(entry: IntervalDayEntry): number {
  return entry.intervals.filter((v) => v !== null).length
}

/** Calculate daily percentage: count of "+" / total intervals * 100 */
export function calculateIntervalPercentage(entry: IntervalDayEntry): number | null {
  const answered = countAnswered(entry)
  if (answered === 0) return null
  return Math.round((countPositive(entry) / entry.numberOfIntervals) * 100)
}

/** Cycle through: null → "+" → "-" → null */
export function cycleIntervalValue(current: IntervalValue): IntervalValue {
  if (current === null) return "+"
  if (current === "+") return "-"
  return null
}
