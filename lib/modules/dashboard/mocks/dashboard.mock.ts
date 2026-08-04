import type {
  DashboardScope,
  DashboardSummary,
  ExpiringItem,
} from "@/lib/types/dashboard.types"
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

const EXPIRING_ITEMS: ExpiringItem[] = sortExpiringItems([
  expiring("e1", "PRIOR_AUTHORIZATION", "Prior Auth #A-1024 · 97153", "Mateo Rivas", -2, "/clients"),
  expiring("e2", "PRIOR_AUTHORIZATION", "Prior Auth #A-1031 · 97155", "Sofía Delgado", 3, "/clients"),
  expiring("e3", "CREDENTIAL", "BCBA Certification", "Laura Méndez", 6, "/users"),
  expiring("e4", "CLIENT_DOCUMENT", "Insurance Card", "Mateo Rivas", 9, "/clients"),
  expiring("e5", "CREDENTIAL", "CPR / First Aid", "Diego Fuentes", 14, "/users"),
  expiring("e6", "HR_DOCUMENT", "Background Check", "Diego Fuentes", 21, "/hr-documents"),
  expiring("e7", "CLIENT_DOCUMENT", "Treatment Consent", "Valentina Cruz", 27, "/clients"),
  expiring("e8", "PRIOR_AUTHORIZATION", "Prior Auth #A-0997 · 97156", "Tomás Herrera", 34, "/clients"),
  expiring("e9", "HR_DOCUMENT", "TB Test", "Laura Méndez", 41, "/hr-documents"),
  expiring("e10", "CREDENTIAL", "RBT Certification", "Camila Ortiz", 52, "/users"),
])

const UTILIZATION_ITEMS = [
  { id: "u1", clientName: "Mateo Rivas", billingCode: "97153", unitsAuthorized: 480, unitsUsed: 449, endDate: isoInDays(21) },
  { id: "u2", clientName: "Sofía Delgado", billingCode: "97155", unitsAuthorized: 160, unitsUsed: 133, endDate: isoInDays(34) },
  { id: "u3", clientName: "Tomás Herrera", billingCode: "97153", unitsAuthorized: 520, unitsUsed: 402, endDate: isoInDays(48) },
  { id: "u4", clientName: "Valentina Cruz", billingCode: "97156", unitsAuthorized: 96, unitsUsed: 68, endDate: isoInDays(56) },
  { id: "u5", clientName: "Camila Ortiz", billingCode: "97153", unitsAuthorized: 400, unitsUsed: 244, endDate: isoInDays(72) },
].map((item) => {
  const percentUsed = Math.round((item.unitsUsed / item.unitsAuthorized) * 100)
  return { ...item, percentUsed, severity: severityFromPercentUsed(percentUsed), href: "/clients" }
})

const TREND_POINTS = [
  { label: "W1", sessions: 96, notesPending: 11 },
  { label: "W2", sessions: 104, notesPending: 9 },
  { label: "W3", sessions: 99, notesPending: 14 },
  { label: "W4", sessions: 112, notesPending: 8 },
  { label: "W5", sessions: 108, notesPending: 12 },
  { label: "W6", sessions: 118, notesPending: 6 },
  { label: "W7", sessions: 115, notesPending: 10 },
  { label: "W8", sessions: 124, notesPending: 7 },
  { label: "W9", sessions: 119, notesPending: 9 },
  { label: "W10", sessions: 131, notesPending: 5 },
  { label: "W11", sessions: 127, notesPending: 8 },
  { label: "W12", sessions: 128, notesPending: 7 },
]

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
    notesPendingSignature: {
      value: 7,
      deltaPercent: 30,
      deltaDirection: "down",
      higherIsBetter: false,
      sparkline: TREND_POINTS.map((p) => p.notesPending),
    },
    authorizationUsage: {
      value: 72,
      unit: "%",
      target: 100,
      deltaPercent: 4.1,
      deltaDirection: "up",
      higherIsBetter: false,
    },
    clinicalMonthlyThisMonth: {
      value: 8,
      target: 12,
      deltaDirection: "flat",
      higherIsBetter: true,
    },
  },
  expiring: { items: EXPIRING_ITEMS, total: EXPIRING_ITEMS.length },
  authorizationUtilization: { items: UTILIZATION_ITEMS },
  trend: { points: TREND_POINTS },
  documentCompliance: { delivered: 120, pending: 34, nearExpiration: 12, expired: 3 },
}

const EMPTY_SUMMARY: DashboardSummary = {
  generatedAt: new Date().toISOString(),
  actionCenter: { total: 0, criticalCount: 0, byKind: {} },
  kpis: DEFAULT_SUMMARY.kpis,
  expiring: { items: [], total: 0 },
  authorizationUtilization: { items: [] },
  trend: DEFAULT_SUMMARY.trend,
  documentCompliance: { delivered: 169, pending: 0, nearExpiration: 0, expired: 0 },
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
