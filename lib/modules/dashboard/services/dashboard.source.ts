import type { DashboardScope, DashboardSummary } from "@/lib/types/dashboard.types"
import { fetchDashboardSummaryMock } from "../mocks/dashboard.mock"
import { fetchDashboardSummaryReal } from "./dashboard.service"

/**
 * LA COSTURA.
 *
 * Único punto donde se decide de dónde sale el dato del dashboard. Los
 * componentes consumen `useDashboardSummary()` y nunca saben cuál de los dos
 * está detrás.
 *
 *   NEXT_PUBLIC_DASHBOARD_MOCK=true   → mock (para desarrollar sin backend)
 *   (cualquier otro valor / ausente)  → servicio HTTP real
 *
 * El default cambió con la entrega del endpoint el 2026-08-05: antes arrancaba
 * en mock porque `/dashboard/summary` no existía y lo seguro era pintar algo;
 * ahora el dato real es el default y el mock queda como herramienta de
 * desarrollo —junto con los escenarios `?mock=empty|error|partial|heavy`.
 */
export const IS_DASHBOARD_MOCKED = process.env.NEXT_PUBLIC_DASHBOARD_MOCK === "true"

export function fetchDashboardSummary(scope: DashboardScope = "company"): Promise<DashboardSummary> {
  return IS_DASHBOARD_MOCKED ? fetchDashboardSummaryMock(scope) : fetchDashboardSummaryReal(scope)
}
