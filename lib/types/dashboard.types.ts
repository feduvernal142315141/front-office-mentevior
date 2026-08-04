/**
 * Dashboard — contrato único
 *
 * Esta es la ÚNICA fuente de verdad de la forma del dato. El mock y el servicio
 * HTTP real se tipan los dos contra esto, así que si el contrato cambia, el mock
 * rompe al compilar y nos enteramos antes de producción.
 *
 * Toda sección es opcional a propósito: el backend va a entregar por partes, y
 * cada widget degrada solo sin tumbar el resto del dashboard.
 *
 * Ver `plans/dashboard.md`.
 */

export type Severity = "critical" | "serious" | "warning" | "good"

export type ExpiringKind =
  | "PRIOR_AUTHORIZATION"
  | "CREDENTIAL"
  | "CLIENT_DOCUMENT"
  | "HR_DOCUMENT"

export interface ExpiringItem {
  id: string
  kind: ExpiringKind
  /** Qué vence. Ej: "Prior Auth #A-1024" */
  title: string
  /** A quién le vence: cliente o miembro del staff */
  subject: string
  expirationDate: string
  /**
   * Lo calcula el backend a propósito: que el front reste fechas contra el reloj
   * del equipo es el mismo bug de desfase que se arregló en `auth.store.ts`.
   * Negativo = ya vencido.
   */
  daysRemaining: number
  severity: Severity
  /** A dónde ir para resolverlo */
  href?: string
}

export interface AuthorizationUtilizationItem {
  id: string
  clientName: string
  billingCode: string
  unitsAuthorized: number
  unitsUsed: number
  /** 0..100 */
  percentUsed: number
  endDate: string
  severity: Severity
  href?: string
}

export interface KpiValue {
  value: number
  /** Variación contra el período anterior */
  deltaPercent?: number
  deltaDirection?: "up" | "down" | "flat"
  /**
   * Decide el COLOR del delta. Sin esto verde/rojo mienten: subir es bueno en
   * sesiones y malo en notas pendientes.
   */
  higherIsBetter?: boolean
  /** Serie corta para el sparkline; 12 puntos */
  sparkline?: number[]
  /** Para KPIs que son un ratio contra un tope (unidades, reportes del mes) */
  target?: number
  /** Sufijo de presentación, ej. "%" */
  unit?: string
}

export interface TrendPoint {
  label: string
  sessions: number
  notesPending: number
}

export interface DocumentComplianceBreakdown {
  delivered: number
  pending: number
  nearExpiration: number
  expired: number
}

export interface ActionCenterSummary {
  total: number
  byKind: Partial<Record<ExpiringKind, number>>
  criticalCount: number
}

export interface DashboardKpis {
  sessionsThisWeek?: KpiValue
  notesPendingSignature?: KpiValue
  authorizationUsage?: KpiValue
  clinicalMonthlyThisMonth?: KpiValue
}

export interface DashboardSummary {
  generatedAt: string
  actionCenter?: ActionCenterSummary
  kpis?: DashboardKpis
  expiring?: { items: ExpiringItem[]; total: number }
  authorizationUtilization?: { items: AuthorizationUtilizationItem[] }
  trend?: { points: TrendPoint[] }
  documentCompliance?: DocumentComplianceBreakdown
}

/** Alcance del resumen: lo del usuario o lo de toda la compañía */
export type DashboardScope = "me" | "company"
