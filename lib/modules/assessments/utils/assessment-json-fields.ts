/**
 * Dos campos del contrato de Assessment viajan como JSON serializado dentro de
 * un string:
 *
 * - `proposedSchedule[].schedule`: el backend exige un objeto con EXACTAMENTE
 *   las 7 keys Monday…Sunday y valores numéricos (horas).
 * - `billingCodes[].settings`: string libre; el front usa la convención del
 *   ejemplo del contrato `{"location":...,"notes":...}`.
 *
 * Todo el (de)serializado vive acá para que el resto del módulo trabaje con
 * objetos tipados.
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

export interface BillingCodeSettings {
  location: string
  notes: string
}

export function parseBillingCodeSettings(raw: string): BillingCodeSettings {
  if (!raw.trim()) return { location: "", notes: "" }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      location: typeof parsed?.location === "string" ? parsed.location : "",
      notes: typeof parsed?.notes === "string" ? parsed.notes : "",
    }
  } catch {
    // Un settings que no siga la convención se conserva visible como nota
    return { location: "", notes: raw }
  }
}

/** Ambos vacíos → string vacío (no se inventa un JSON hueco) */
export function serializeBillingCodeSettings(settings: BillingCodeSettings): string {
  const location = settings.location.trim()
  const notes = settings.notes.trim()
  if (!location && !notes) return ""
  return JSON.stringify({ location, notes })
}
