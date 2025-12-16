import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isToday as isTodayFns,
  addMinutes as addMinutesFns,
  parseISO,
} from "date-fns"

export function getWeekStart(date?: string | Date): string {
  const d = date ? (typeof date === "string" ? parseISO(date) : date) : new Date()
  return startOfWeek(d, { weekStartsOn: 0 }).toISOString()
}

export function getWeekEnd(date?: string | Date): string {
  const d = date ? (typeof date === "string" ? parseISO(date) : date) : new Date()
  return endOfWeek(d, { weekStartsOn: 0 }).toISOString()
}

export function getWeekDays(weekStart: string): Date[] {
  const start = parseISO(weekStart)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "h:mm a")
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d, yyyy")
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d, yyyy h:mm a")
}

export function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart)
  const end = addDays(start, 6)
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === "string" ? parseISO(date) : date
  return isTodayFns(d)
}

export function addMinutes(date: string | Date, minutes: number): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return addMinutesFns(d, minutes).toISOString()
}
