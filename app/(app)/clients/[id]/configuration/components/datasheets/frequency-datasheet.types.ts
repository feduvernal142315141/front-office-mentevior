export interface DayEntry {
  occurrences: number
  initials: string
  environmentalNote: string
}

export type WeekEntries = Record<string, DayEntry>

export function createEmptyDayEntry(): DayEntry {
  return { occurrences: 0, initials: "", environmentalNote: "" }
}

export { getDateKey, parseLocalDate } from "./datasheet-utils"
