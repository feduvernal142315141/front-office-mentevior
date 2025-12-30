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
 * Convierte una fecha ISO string a formato YYYY-MM-DD
 * Extrae directamente la parte de fecha sin conversiones de timezone
 * 
 * @param isoString - Fecha en formato ISO (ej: "2025-12-30T00:00:00Z" o "2025-12-30")
 * @returns Fecha en formato YYYY-MM-DD (ej: "2025-12-30")
 */
export function isoToLocalDate(isoString: string): string {
  if (!isoString) return ""
  
  // Extraer solo la parte YYYY-MM-DD (antes de la T si existe)
  // Esto evita cualquier conversión de timezone
  const dateOnly = isoString.includes('T') ? isoString.split('T')[0] : isoString
  
  return dateOnly
}

/**
 * Parsea una fecha ISO/string a un objeto Date en zona horaria local
 * Evita problemas de timezone al mostrar fechas en la UI
 * 
 * @param dateString - Fecha en formato ISO o YYYY-MM-DD (ej: "2025-12-30T00:00:00Z" o "2025-12-30")
 * @returns Objeto Date en zona local
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date()
  
  // Si es una fecha ISO completa (con hora), extraer solo la parte de la fecha
  const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString
  
  // Parsear YYYY-MM-DD en zona local
  const [year, month, day] = dateOnly.split('-').map(Number)
  
  // Crear fecha en zona local (mes es 0-indexed)
  return new Date(year, month - 1, day)
}
