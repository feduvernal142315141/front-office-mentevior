/**
 * Unit Calculation Utilities
 * Implements the 8-minute rule for ABA billing.
 *
 * Each billable unit = 15 minutes.
 * A partial unit counts only if the remainder is >= 8 minutes.
 */

/**
 * Calculates billable units from total minutes using the 8-minute rule.
 *
 * Examples:
 *   7 min → 0 units
 *   8 min → 1 unit
 *  22 min → 1 unit
 *  23 min → 2 units
 *  60 min → 4 units
 * 126 min → 8 units (remainder 6 < 8)
 * 128 min → 9 units (remainder 8 >= 8)
 */
export function calculateBillableUnits(totalMinutes: number): number {
  if (totalMinutes <= 0) return 0

  const fullUnits = Math.floor(totalMinutes / 15)
  const remainder = totalMinutes % 15

  return remainder >= 8 ? fullUnits + 1 : fullUnits
}

/**
 * Calculates duration in minutes between two HH:mm (24h) time strings.
 * Returns 0 if inputs are invalid or endTime <= startTime.
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0

  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)

  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0

  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em

  const diff = endMinutes - startMinutes
  return diff > 0 ? diff : 0
}

/**
 * Returns the current time (or a given date) rounded to the nearest 15-minute slot.
 * Output format: "HH:mm" (24h).
 */
export function roundToNearest15Minutes(date?: Date): string {
  const d = date ?? new Date()
  const minutes = d.getMinutes()
  const rounded = Math.round(minutes / 15) * 15

  let hours = d.getHours()
  let finalMinutes = rounded

  if (rounded === 60) {
    hours += 1
    finalMinutes = 0
  }

  if (hours >= 24) hours = 0

  return `${String(hours).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`
}

/**
 * Formats a duration in minutes as a human-readable string.
 * Examples: 60 → "1h 0m", 90 → "1h 30m", 45 → "0h 45m"
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "—"
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m}m`
}
