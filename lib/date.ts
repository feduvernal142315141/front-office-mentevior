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

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD usando la zona horaria local
 * Evita problemas con toISOString() que usa UTC
 */
export function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte una fecha ISO string a formato YYYY-MM-DD en zona horaria local
 * Evita el desfase de un día que puede ocurrir con .split("T")[0] en fechas UTC
 * 
 * @param isoString - Fecha en formato ISO (ej: "2025-12-30T00:00:00Z")
 * @returns Fecha en formato YYYY-MM-DD (ej: "2025-12-30")
 */
export function isoToLocalDate(isoString: string): string {
  if (!isoString) return ""
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
