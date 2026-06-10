export interface DayEntry {
  occurrences: number
  initials: string
  environmentalNote: string
}

export type WeekEntries = Record<string, DayEntry>

export function createEmptyDayEntry(): DayEntry {
  return { occurrences: 0, initials: "", environmentalNote: "" }
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
