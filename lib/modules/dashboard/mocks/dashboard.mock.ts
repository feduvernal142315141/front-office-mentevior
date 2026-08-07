import type {
  DashboardScope,
  DashboardSummary,
  ExpiringItem,
} from "@/lib/types/dashboard.types"
import { clientProfileHref } from "../utils/safe-href"
import { severityFromDaysRemaining, severityFromPercentUsed, sortExpiringItems } from "../utils/severity"

/**
 * Datos mock del dashboard.
 *
 * Tipados contra `DashboardSummary`, el mismo contrato que usa el servicio real:
 * si backend cambia la forma, esto rompe al compilar.
 *
 * Modela la realidad, no el caso feliz — hay latencia, escenarios de error, de
 * vacío y de entrega parcial, para poder construir esos estados hoy en vez de
 * descubrirlos el día que backend conecte.
 */

export type MockScenario = "default" | "empty" | "error" | "partial" | "heavy"

/** Latencia simulada: sin esto los estados de carga nunca se ven al desarrollar */
const MOCK_LATENCY_MS = 600

function isoInDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function expiring(
  id: string,
  kind: ExpiringItem["kind"],
  title: string,
  subject: string,
  daysRemaining: number,
  href?: string,
): ExpiringItem {
  return {
    id,
    kind,
    title,
    subject,
    expirationDate: isoInDays(daysRemaining),
    daysRemaining,
    severity: severityFromDaysRemaining(daysRemaining),
    href,
  }
}

/** UUIDs estables: el enlace de cada fila se arma con el del CLIENTE, no con `id` */
const MOCK_CLIENT_IDS = {
  mateo: "11111111-1111-1111-1111-111111111111",
  sofia: "22222222-2222-2222-2222-222222222222",
  tomas: "33333333-3333-3333-3333-333333333333",
  valentina: "44444444-4444-4444-4444-444444444444",
  camila: "55555555-5555-5555-5555-555555555555",
}

// Los de cliente enlazan al paso del perfil donde se atienden; los de staff van a
// su propio módulo. Mismas rutas que manda el backend desde el 2026-08-07.
const EXPIRING_ITEMS: ExpiringItem[] = sortExpiringItems([
  expiring("e1", "PRIOR_AUTHORIZATION", "Prior Auth #A-1024 · 97153", "Mateo Rivas", -2, clientProfileHref(MOCK_CLIENT_IDS.mateo, "priorAuth")),
  expiring("e2", "PRIOR_AUTHORIZATION", "Prior Auth #A-1031 · 97155", "Sofía Delgado", 3, clientProfileHref(MOCK_CLIENT_IDS.sofia, "priorAuth")),
  expiring("e3", "CREDENTIAL", "BCBA Certification", "Laura Méndez", 6, "/users"),
  expiring("e4", "CLIENT_DOCUMENT", "Insurance Card", "Mateo Rivas", 9, clientProfileHref(MOCK_CLIENT_IDS.mateo, "documents")),
  expiring("e5", "CREDENTIAL", "CPR / First Aid", "Diego Fuentes", 14, "/users"),
  expiring("e6", "HR_DOCUMENT", "Background Check", "Diego Fuentes", 21, "/hr-documents"),
  expiring("e7", "CLIENT_DOCUMENT", "Treatment Consent", "Valentina Cruz", 27, clientProfileHref(MOCK_CLIENT_IDS.valentina, "documents")),
  expiring("e8", "PRIOR_AUTHORIZATION", "Prior Auth #A-0997 · 97156", "Tomás Herrera", 34, clientProfileHref(MOCK_CLIENT_IDS.tomas, "priorAuth")),
  expiring("e9", "HR_DOCUMENT", "TB Test", "Laura Méndez", 41, "/hr-documents"),
  expiring("e10", "CREDENTIAL", "RBT Certification", "Camila Ortiz", 52, "/users"),
])

const UTILIZATION_ITEMS = [
  { id: "u1", clientId: MOCK_CLIENT_IDS.mateo, clientName: "Mateo Rivas", billingCode: "97153", unitsAuthorized: 480, unitsUsed: 449, endDate: isoInDays(21) },
  { id: "u2", clientId: MOCK_CLIENT_IDS.sofia, clientName: "Sofía Delgado", billingCode: "97155", unitsAuthorized: 160, unitsUsed: 133, endDate: isoInDays(34) },
  { id: "u3", clientId: MOCK_CLIENT_IDS.tomas, clientName: "Tomás Herrera", billingCode: "97153", unitsAuthorized: 520, unitsUsed: 402, endDate: isoInDays(48) },
  { id: "u4", clientId: MOCK_CLIENT_IDS.valentina, clientName: "Valentina Cruz", billingCode: "97156", unitsAuthorized: 96, unitsUsed: 68, endDate: isoInDays(56) },
  { id: "u5", clientId: MOCK_CLIENT_IDS.camila, clientName: "Camila Ortiz", billingCode: "97153", unitsAuthorized: 400, unitsUsed: 244, endDate: isoInDays(72) },
].map((item) => {
  const percentUsed = Math.round((item.unitsUsed / item.unitsAuthorized) * 100)
  return {
    ...item,
    percentUsed,
    severity: severityFromPercentUsed(percentUsed),
    href: clientProfileHref(item.clientId, "priorAuth"),
  }
})

/** "May 18" — el mismo formato de etiqueta que manda el backend */
function weekLabel(weeksAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - weeksAgo * 7)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Sólo sesiones: la serie de notas pendientes salió del contrato el 2026-08-07 */
const WEEKLY_SESSIONS = [96, 104, 99, 112, 108, 118, 115, 124, 119, 131, 127, 128]

const TREND_POINTS = WEEKLY_SESSIONS.map((sessions, index) => ({
  sessions,
  label: weekLabel(WEEKLY_SESSIONS.length - 1 - index),
}))

const DEFAULT_SUMMARY: DashboardSummary = {
  generatedAt: new Date().toISOString(),
  actionCenter: {
    total: EXPIRING_ITEMS.length,
    criticalCount: EXPIRING_ITEMS.filter((i) => i.severity === "critical").length,
    byKind: {
      PRIOR_AUTHORIZATION: EXPIRING_ITEMS.filter((i) => i.kind === "PRIOR_AUTHORIZATION").length,
      CREDENTIAL: EXPIRING_ITEMS.filter((i) => i.kind === "CREDENTIAL").length,
      CLIENT_DOCUMENT: EXPIRING_ITEMS.filter((i) => i.kind === "CLIENT_DOCUMENT").length,
      HR_DOCUMENT: EXPIRING_ITEMS.filter((i) => i.kind === "HR_DOCUMENT").length,
    },
  },
  kpis: {
    sessionsThisWeek: {
      value: 128,
      deltaPercent: 12.4,
      deltaDirection: "up",
      higherIsBetter: true,
      sparkline: TREND_POINTS.map((p) => p.sessions),
    },
    notesPendingSignature: 7,
    authorizationUsage: {
      value: 72,
      unit: "%",
      target: 100,
      // Sin delta a propósito: el backend no guarda snapshots de `usedUnits`, así
      // que este KPI nunca trae variación. Ver el contrato del 2026-08-05.
      higherIsBetter: false,
    },
    clinicalMonthlyThisMonth: {
      value: 8,
      target: 12,
      deltaPercent: 33.3,
      deltaDirection: "up",
      higherIsBetter: true,
    },
  },
  expiring: { items: EXPIRING_ITEMS, total: EXPIRING_ITEMS.length },
  authorizationUtilization: { items: UTILIZATION_ITEMS },
  trend: { points: TREND_POINTS },
  documentCompliance: { delivered: 120, pending: 34, nearExpiration: 12, expired: 3 },
}

/**
 * Compañía nueva: el backend responde con la forma completa pero sin nada que
 * contar. Es el escenario que ejercita TODOS los estados vacíos —incluidos los
 * de tendencia y cumplimiento, que con cero no dibujan nada.
 */
const EMPTY_SUMMARY: DashboardSummary = {
  generatedAt: new Date().toISOString(),
  actionCenter: { total: 0, criticalCount: 0, byKind: {} },
  kpis: DEFAULT_SUMMARY.kpis,
  expiring: { items: [], total: 0 },
  authorizationUtilization: { items: [] },
  trend: { points: [] },
  documentCompliance: { delivered: 0, pending: 0, nearExpiration: 0, expired: 0 },
}

/** Backend entregó unas secciones y otras todavía no: cada widget degrada solo */
const PARTIAL_SUMMARY: DashboardSummary = {
  generatedAt: new Date().toISOString(),
  actionCenter: DEFAULT_SUMMARY.actionCenter,
  expiring: DEFAULT_SUMMARY.expiring,
  kpis: {
    sessionsThisWeek: DEFAULT_SUMMARY.kpis?.sessionsThisWeek,
    notesPendingSignature: DEFAULT_SUMMARY.kpis?.notesPendingSignature,
  },
  // authorizationUtilization, trend y documentCompliance sin entregar
}

const HEAVY_SUMMARY: DashboardSummary = {
  ...DEFAULT_SUMMARY,
  actionCenter: { ...DEFAULT_SUMMARY.actionCenter!, total: 87, criticalCount: 19 },
  expiring: {
    total: 87,
    items: sortExpiringItems(
      Array.from({ length: 40 }, (_, index) => {
        const source = EXPIRING_ITEMS[index % EXPIRING_ITEMS.length]
        const daysRemaining = ((index * 7) % 68) - 5
        return {
          ...source,
          id: `heavy-${index}`,
          subject: `${source.subject} ${Math.floor(index / EXPIRING_ITEMS.length) + 1}`,
          expirationDate: isoInDays(daysRemaining),
          daysRemaining,
          severity: severityFromDaysRemaining(daysRemaining),
        }
      }),
    ),
  },
}

const SCENARIOS: Record<Exclude<MockScenario, "error">, DashboardSummary> = {
  default: DEFAULT_SUMMARY,
  empty: EMPTY_SUMMARY,
  partial: PARTIAL_SUMMARY,
  heavy: HEAVY_SUMMARY,
}

/** Se lee de `?mock=` para poder recorrer los estados sin tocar código */
export function readMockScenario(): MockScenario {
  if (typeof window === "undefined") return "default"
  const requested = new URLSearchParams(window.location.search).get("mock")
  if (requested && requested in SCENARIOS) return requested as MockScenario
  return requested === "error" ? "error" : "default"
}

export async function fetchDashboardSummaryMock(_scope?: DashboardScope): Promise<DashboardSummary> {
  const scenario = readMockScenario()

  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  if (scenario === "error") {
    throw new Error("Mock error scenario: the dashboard service is unavailable")
  }

  return SCENARIOS[scenario]
}
