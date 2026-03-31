import {
  differenceInDays,
  differenceInCalendarMonths,
  parseISO,
  isValid,
} from "date-fns"
import type { DurationInterval, PriorAuthStatus } from "@/lib/types/prior-authorization.types"

// ─── Status Calculation ───────────────────────────────────────────────────────
// Rules:
//  - Expired:  today > endDate
//  - Expiring: endDate − today ≤ 60 days (≈ 2 months) AND not yet expired
//  - Approved: today is within the [startDate, endDate] range
//
// This is a pure function — no side effects, safe to call in render.
// TODO (backend): If the API returns a `status` field, the frontend can still
// override it with this calculation to ensure consistency without a full refresh.

export function calculatePAStatus(startDate: string, endDate: string): PriorAuthStatus {
  if (!startDate || !endDate) return "Approved"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let end: Date
  try {
    end = parseISO(endDate)
    if (!isValid(end)) return "Approved"
  } catch {
    return "Approved"
  }

  end.setHours(0, 0, 0, 0)

  if (today > end) return "Expired"

  const daysUntilExpiry = differenceInDays(end, today)
  if (daysUntilExpiry <= 60) return "Expiring"

  return "Approved"
}

// ─── Duration Calculation ─────────────────────────────────────────────────────
// Auto-calculated read-only field shown in the PA form.
// Rounds to 2 decimal places for weeks/months.

export function calculateDuration(
  startDate: string,
  endDate: string,
  interval: DurationInterval
): number {
  if (!startDate || !endDate) return 0

  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    if (!isValid(start) || !isValid(end)) return 0
    if (end < start) return 0

    const days = differenceInDays(end, start)

    if (interval === "days") return days
    if (interval === "weeks") return Math.round((days / 7) * 100) / 100
    // months
    return Math.round(differenceInCalendarMonths(end, start) * 100) / 100
  } catch {
    return 0
  }
}

// ─── Units helpers ────────────────────────────────────────────────────────────
// 1 unit = 15 min → 4 units = 1 hour

export function unitsToHours(units: number): number {
  return Math.round((units / 4) * 100) / 100
}

export function hoursToUnits(hours: number): number {
  return Math.round(hours * 4)
}

/**
 * Builds a human-readable usage summary string.
 * e.g. "5.25 hours/week, 21.00 units/week"
 *
 * TODO (backend): This can be provided directly by the API once real usage
 * data is tracked, saving the frontend from computing projections.
 */
export function formatUsageRate(units: number, totalDays: number): string {
  if (totalDays <= 0 || units <= 0) return "0 hours/week, 0 units/week"

  const weeks = totalDays / 7
  const unitsPerWeek = Math.round((units / weeks) * 100) / 100
  const hoursPerWeek = Math.round(unitsToHours(unitsPerWeek) * 100) / 100

  return `${hoursPerWeek} hours/week, ${unitsPerWeek} units/week`
}

/**
 * Estimated usage rate based on the full PA duration.
 */
export function calculateEstimatedUsage(
  approvedUnits: number,
  startDate: string,
  endDate: string
): string {
  const totalDays = calculateDuration(startDate, endDate, "days")
  return formatUsageRate(approvedUnits, totalDays)
}

/**
 * Remaining usage rate based on remaining units and remaining days.
 */
export function calculateRemainingUsage(
  remainingUnits: number,
  endDate: string
): string {
  if (!endDate) return "0 hours/week, 0 units/week"

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = parseISO(endDate)
    end.setHours(0, 0, 0, 0)

    const remainingDays = differenceInDays(end, today)
    return formatUsageRate(remainingUnits, remainingDays)
  } catch {
    return "0 hours/week, 0 units/week"
  }
}

// ─── Status Badge Styles ──────────────────────────────────────────────────────

export function getPAStatusBadgeClasses(status: PriorAuthStatus): string {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    case "Expiring":
      return "bg-amber-50 text-amber-700 border border-amber-200"
    case "Expired":
      return "bg-red-50 text-red-600 border border-red-200"
  }
}
