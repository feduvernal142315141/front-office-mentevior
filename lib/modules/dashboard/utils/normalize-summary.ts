import type {
  AuthorizationUtilizationItem,
  DashboardSummary,
  ExpiringItem,
  ExpiringKind,
  KpiValue,
  Severity,
  TrendPoint,
} from "@/lib/types/dashboard.types"
import { severityFromDaysRemaining, severityFromPercentUsed } from "./severity"

/**
 * Capa anticorrupción entre el JSON del backend y los widgets.
 *
 * No es desconfianza gratuita: el dashboard es la primera pantalla después del
 * login, así que un campo que llegue `null` donde se esperaba un número no puede
 * tumbar la vista entera. Todo lo que entra acá sale cumpliendo
 * `DashboardSummary` o no sale.
 *
 * Reglas:
 * - Lo que falta se omite (`undefined`), y el widget muestra su estado vacío.
 * - Lo que llega mal tipado se coacciona si se puede, y se descarta si no.
 * - Lo derivable se deriva: sin `severity`, se calcula del dato que sí llegó.
 */

type Json = Record<string, unknown>

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Acepta `12`, `"12"` y `12.0000`; rechaza `null`, `""` y `NaN`. */
function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = toNumber(value)
  return parsed === undefined ? fallback : Math.round(parsed)
}

function toText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

const SEVERITIES: Severity[] = ["critical", "serious", "warning", "good"]
const KINDS: ExpiringKind[] = [
  "PRIOR_AUTHORIZATION",
  "CREDENTIAL",
  "CLIENT_DOCUMENT",
  "HR_DOCUMENT",
]

function toSeverity(value: unknown): Severity | undefined {
  const text = toText(value)?.toLowerCase()
  return SEVERITIES.find((severity) => severity === text)
}

function toKind(value: unknown): ExpiringKind | undefined {
  const text = toText(value)?.toUpperCase()
  return KINDS.find((kind) => kind === text)
}

function toNumberList(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const points = value.map(toNumber).filter((point): point is number => point !== undefined)
  return points.length > 0 ? points : undefined
}

// ============================================
// Secciones
// ============================================

function normalizeKpi(raw: unknown): KpiValue | undefined {
  if (!isObject(raw)) return undefined

  const value = toNumber(raw.value)
  // Un KPI sin valor no es un KPI: mejor que el tile diga "pendiente" a que
  // pinte un 0 que el usuario leería como dato real.
  if (value === undefined) return undefined

  const direction = toText(raw.deltaDirection)?.toLowerCase()

  return {
    value,
    deltaPercent: toNumber(raw.deltaPercent),
    deltaDirection:
      direction === "up" || direction === "down" || direction === "flat" ? direction : undefined,
    higherIsBetter: typeof raw.higherIsBetter === "boolean" ? raw.higherIsBetter : undefined,
    sparkline: toNumberList(raw.sparkline),
    target: toNumber(raw.target),
    unit: toText(raw.unit),
  }
}

function normalizeExpiringItem(raw: unknown, index: number): ExpiringItem | undefined {
  if (!isObject(raw)) return undefined

  const kind = toKind(raw.kind)
  const title = toText(raw.title)
  // Sin tipo ni título la fila no se puede ni etiquetar ni agrupar: se descarta
  // en vez de pintar una fila muda.
  if (!kind || !title) return undefined

  const daysRemaining = toInt(raw.daysRemaining)

  return {
    id: toText(raw.id) ?? `${kind}-${index}`,
    kind,
    title,
    subject: toText(raw.subject) ?? "—",
    expirationDate: toText(raw.expirationDate) ?? "",
    daysRemaining,
    // El backend manda `severity`; si faltara se deriva con los mismos umbrales
    // que ya usa el front, y la lista sigue ordenando bien.
    severity: toSeverity(raw.severity) ?? severityFromDaysRemaining(daysRemaining),
    href: toText(raw.href),
  }
}

function normalizeUtilizationItem(raw: unknown, index: number): AuthorizationUtilizationItem | undefined {
  if (!isObject(raw)) return undefined

  const clientName = toText(raw.clientName)
  if (!clientName) return undefined

  const unitsAuthorized = toNumber(raw.unitsAuthorized) ?? 0
  const unitsUsed = toNumber(raw.unitsUsed) ?? 0
  const percentUsed =
    toNumber(raw.percentUsed) ??
    (unitsAuthorized > 0 ? Math.round((unitsUsed / unitsAuthorized) * 100) : 0)

  return {
    id: toText(raw.id) ?? `utilization-${index}`,
    clientName,
    billingCode: toText(raw.billingCode) ?? "—",
    unitsAuthorized,
    unitsUsed,
    percentUsed,
    endDate: toText(raw.endDate) ?? "",
    severity: toSeverity(raw.severity) ?? severityFromPercentUsed(percentUsed),
    href: toText(raw.href),
  }
}

function normalizeTrendPoint(raw: unknown): TrendPoint | undefined {
  if (!isObject(raw)) return undefined
  const label = toText(raw.label)
  if (!label) return undefined

  return {
    label,
    sessions: toInt(raw.sessions),
    notesPending: toInt(raw.notesPending),
  }
}

// ============================================
// Entrada
// ============================================

/**
 * El contrato dice que la respuesta viene pelada, pero el resto de los endpoints
 * del sistema envuelven en `data`. Desenvolver si hace falta cuesta una línea y
 * evita un dashboard en blanco si alguien uniformiza el backend mañana.
 */
function unwrap(payload: unknown): Json | null {
  if (!isObject(payload)) return null
  if ("generatedAt" in payload || "kpis" in payload || "actionCenter" in payload) return payload

  for (const key of ["data", "value", "result"]) {
    const inner = payload[key]
    if (isObject(inner)) return inner
  }

  return payload
}

export function normalizeDashboardSummary(payload: unknown): DashboardSummary {
  const root = unwrap(payload)
  if (!root) {
    throw new Error("The dashboard service returned an unexpected payload")
  }

  const summary: DashboardSummary = {
    generatedAt: toText(root.generatedAt) ?? new Date().toISOString(),
  }

  if (isObject(root.actionCenter)) {
    const byKindRaw = isObject(root.actionCenter.byKind) ? root.actionCenter.byKind : {}
    const byKind: Partial<Record<ExpiringKind, number>> = {}

    for (const [key, value] of Object.entries(byKindRaw)) {
      const kind = toKind(key)
      const count = toNumber(value)
      if (kind && count !== undefined) byKind[kind] = Math.round(count)
    }

    summary.actionCenter = {
      total: toInt(root.actionCenter.total),
      criticalCount: toInt(root.actionCenter.criticalCount),
      byKind,
    }
  }

  if (isObject(root.kpis)) {
    const kpis = {
      sessionsThisWeek: normalizeKpi(root.kpis.sessionsThisWeek),
      notesPendingSignature: normalizeKpi(root.kpis.notesPendingSignature),
      authorizationUsage: normalizeKpi(root.kpis.authorizationUsage),
      clinicalMonthlyThisMonth: normalizeKpi(root.kpis.clinicalMonthlyThisMonth),
    }
    // Si ninguno sobrevivió, se omite la sección entera para que la fila muestre
    // "pendiente" en lugar de cuatro tiles vacíos.
    if (Object.values(kpis).some(Boolean)) summary.kpis = kpis
  }

  if (isObject(root.expiring)) {
    const items = Array.isArray(root.expiring.items)
      ? root.expiring.items
          .map(normalizeExpiringItem)
          .filter((item): item is ExpiringItem => item !== undefined)
      : []

    summary.expiring = {
      items,
      // `total` es el conteo real sin truncar: el backend manda el top 20 y el
      // hero necesita el número completo. Si no viniera, el largo de la lista es
      // lo mejor que tenemos.
      total: toNumber(root.expiring.total) ?? items.length,
    }
  }

  if (isObject(root.authorizationUtilization)) {
    const items = Array.isArray(root.authorizationUtilization.items)
      ? root.authorizationUtilization.items
          .map(normalizeUtilizationItem)
          .filter((item): item is AuthorizationUtilizationItem => item !== undefined)
      : []

    summary.authorizationUtilization = { items }
  }

  if (isObject(root.trend)) {
    const points = Array.isArray(root.trend.points)
      ? root.trend.points
          .map(normalizeTrendPoint)
          .filter((point): point is TrendPoint => point !== undefined)
      : []

    summary.trend = { points }
  }

  if (isObject(root.documentCompliance)) {
    summary.documentCompliance = {
      delivered: toInt(root.documentCompliance.delivered),
      pending: toInt(root.documentCompliance.pending),
      nearExpiration: toInt(root.documentCompliance.nearExpiration),
      expired: toInt(root.documentCompliance.expired),
    }
  }

  return summary
}
