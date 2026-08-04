import type { DashboardScope, DashboardSummary } from "@/lib/types/dashboard.types"
import { fetchDashboardSummaryMock } from "../mocks/dashboard.mock"
import { fetchDashboardSummaryReal } from "./dashboard.service"

/**
 * LA COSTURA.
 *
 * Único punto donde se decide de dónde sale el dato del dashboard. Los
 * componentes consumen `useDashboardSummary()` y nunca saben cuál de los dos
 * está detrás, así que conectar el backend es cambiar una variable de entorno
 * y no tocar una sola línea de UI.
 *
 *   NEXT_PUBLIC_DASHBOARD_MOCK=false   → servicio HTTP real
 *   (cualquier otro valor / ausente)   → mock
 *
 * Arranca en mock a propósito: mientras el endpoint no exista, el default seguro
 * es el que pinta algo en vez de romper.
 */
export const IS_DASHBOARD_MOCKED = process.env.NEXT_PUBLIC_DASHBOARD_MOCK !== "false"

export function fetchDashboardSummary(scope: DashboardScope = "company"): Promise<DashboardSummary> {
  return IS_DASHBOARD_MOCKED ? fetchDashboardSummaryMock(scope) : fetchDashboardSummaryReal(scope)
}
