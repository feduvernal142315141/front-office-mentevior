/**
 * `proposedSchedule[].schedule` viaja como JSON serializado dentro de un
 * string: el backend exige un objeto con EXACTAMENTE las 7 keys Monday…Sunday
 * y valores string con rangos de hora (ej. "2:00 PM-4:00 PM").
 */

export const SCHEDULE_DAY_KEYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

export type ScheduleDayKey = (typeof SCHEDULE_DAY_KEYS)[number]

/** Rango de hora por día como texto; "" o null = sin horario */
export type ScheduleHours = Record<ScheduleDayKey, string>

export const EMPTY_SCHEDULE_HOURS: ScheduleHours = {
  Monday: "",
  Tuesday: "",
  Wednesday: "",
  Thursday: "",
  Friday: "",
  Saturday: "",
  Sunday: "",
}

export function parseProposedSchedule(raw: string): ScheduleHours {
  const hours: ScheduleHours = { ...EMPTY_SCHEDULE_HOURS }
  if (!raw.trim()) return hours

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const day of SCHEDULE_DAY_KEYS) {
      const value = parsed?.[day]
      if (typeof value === "string") {
        hours[day] = value
      } else if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        // Legacy: numeric hours → keep as string for display
        hours[day] = String(value)
      }
    }
  } catch {
    // Schedule ilegible: se parte de cero en vez de romper el formulario
  }
  return hours
}

/** Emite las 7 keys con strings (rangos de hora o vacío) */
export function serializeProposedSchedule(hours: ScheduleHours): string {
  const schedule: Record<ScheduleDayKey, string | null> = {} as Record<ScheduleDayKey, string | null>
  for (const day of SCHEDULE_DAY_KEYS) {
    const value = hours[day].trim()
    schedule[day] = value || null
  }
  return JSON.stringify(schedule)
}

/**
 * Parsea un rango de hora "h:mm AM/PM-h:mm AM/PM" y devuelve las horas
 * de diferencia. Devuelve 0 si no puede parsear.
 */
export function parseTimeRangeHours(range: string): number {
  if (!range || !range.includes("-")) return 0
  const [startStr, endStr] = range.split("-").map((s) => s.trim())
  if (!startStr || !endStr) return 0

  const toMinutes = (time: string): number | null => {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return null
    let h = parseInt(match[1], 10)
    const m = parseInt(match[2], 10)
    const period = match[3].toUpperCase()
    if (period === "PM" && h !== 12) h += 12
    if (period === "AM" && h === 12) h = 0
    return h * 60 + m
  }

  const startMin = toMinutes(startStr)
  const endMin = toMinutes(endStr)
  if (startMin === null || endMin === null || endMin <= startMin) return 0
  return (endMin - startMin) / 60
}

/**
 * Assessments guardados antes del cambio de contrato traen `settings` como
 * JSON `{"location":...,"notes":...}`. Se aplana a texto legible; el texto
 * plano actual pasa tal cual.
 */
export function normalizeBillingCodeSettings(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith("{")) return trimmed

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    const parts = [parsed.location, parsed.notes].filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    )
    return parts.length > 0 ? parts.join(" — ") : trimmed
  } catch {
    return trimmed
  }
}
