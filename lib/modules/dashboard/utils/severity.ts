import type { ExpiringItem, ExpiringKind, Severity } from "@/lib/types/dashboard.types"

/**
 * Umbrales de severidad — TODOS viven acá.
 *
 * La práctica de dashboards clínicos es tajante: los umbrales mal calibrados son
 * la principal causa de que un dashboard se abandone. Deben calibrarse contra el
 * histórico propio, así que estos son un punto de partida discutible, no un
 * dogma; cambiarlos es una línea y mañana pueden ser configuración de compañía.
 *
 * Ver `plans/dashboard.md` §6.1.
 */

/** Días restantes para caer en cada severidad (el corte es "hasta N días") */
export const EXPIRATION_THRESHOLDS = {
  critical: 7,
  serious: 30,
  warning: 60,
} as const

/** Porcentaje de unidades consumidas de una autorización */
export const UTILIZATION_THRESHOLDS = {
  critical: 90,
  serious: 75,
  warning: 60,
} as const

/** Cuántos días hacia adelante mira el dashboard */
export const EXPIRATION_HORIZON_DAYS = EXPIRATION_THRESHOLDS.warning

export function severityFromDaysRemaining(daysRemaining: number): Severity {
  if (daysRemaining <= EXPIRATION_THRESHOLDS.critical) return "critical"
  if (daysRemaining <= EXPIRATION_THRESHOLDS.serious) return "serious"
  if (daysRemaining <= EXPIRATION_THRESHOLDS.warning) return "warning"
  return "good"
}

export function severityFromPercentUsed(percentUsed: number): Severity {
  if (percentUsed >= UTILIZATION_THRESHOLDS.critical) return "critical"
  if (percentUsed >= UTILIZATION_THRESHOLDS.serious) return "serious"
  if (percentUsed >= UTILIZATION_THRESHOLDS.warning) return "warning"
  return "good"
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  warning: 2,
  good: 3,
}

/**
 * severidad ↓ → días restantes ↑ → tipo (desempate estable).
 * Sin el desempate por tipo la lista "baila" entre refrescos y el usuario pierde
 * el hilo de lo que estaba mirando.
 */
export function compareExpiringItems(a: ExpiringItem, b: ExpiringItem): number {
  const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  if (bySeverity !== 0) return bySeverity

  const byDays = a.daysRemaining - b.daysRemaining
  if (byDays !== 0) return byDays

  return a.kind.localeCompare(b.kind)
}

export function sortExpiringItems(items: ExpiringItem[]): ExpiringItem[] {
  return [...items].sort(compareExpiringItems)
}

export const EXPIRING_KIND_LABEL: Record<ExpiringKind, string> = {
  PRIOR_AUTHORIZATION: "Prior Authorization",
  CREDENTIAL: "Credential",
  CLIENT_DOCUMENT: "Client Document",
  HR_DOCUMENT: "HR Document",
}

/** Texto del tiempo restante. Legible antes que exacto. */
export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const overdue = Math.abs(daysRemaining)
    return overdue === 1 ? "1 day overdue" : `${overdue} days overdue`
  }
  if (daysRemaining === 0) return "Expires today"
  if (daysRemaining === 1) return "1 day left"
  return `${daysRemaining} days left`
}
