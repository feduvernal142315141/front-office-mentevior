/**
 * `proposedSchedule[].schedule` viaja como JSON serializado dentro de un
 * string: el backend exige un objeto con EXACTAMENTE las 7 keys Monday…Sunday
 * y valores numéricos (horas). Todo el (de)serializado vive acá.
 *
 * (`billingCodes[].settings` fue JSON hasta el contrato 2026-08-18; hoy es
 * texto plano y no necesita helpers.)
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

/** Horas por día como texto de input; "" se serializa como 0 */
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
      if (typeof value === "number" && Number.isFinite(value)) {
        hours[day] = String(value)
      }
    }
  } catch {
    // Schedule ilegible: se parte de cero en vez de romper el formulario
  }
  return hours
}

/** Siempre emite las 7 keys con valores numéricos, como exige el backend */
export function serializeProposedSchedule(hours: ScheduleHours): string {
  const schedule: Record<ScheduleDayKey, number> = {} as Record<ScheduleDayKey, number>
  for (const day of SCHEDULE_DAY_KEYS) {
    const parsed = Number.parseFloat(hours[day])
    schedule[day] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }
  return JSON.stringify(schedule)
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
