import { serviceGet } from "@/lib/services/baseService"
import type { DashboardScope, DashboardSummary } from "@/lib/types/dashboard.types"

/**
 * Servicio real del dashboard.
 *
 * Endpoint propuesto a backend: un único agregado ya scope-eado por rol, con
 * conteos + top N por bucket. La alternativa (pegarle a cada módulo) son 6+
 * requests paginados sólo para contar, y el `total` de paginación no es
 * confiable de forma pareja en todos los listados.
 *
 * Ver `plans/dashboard.md` §5.4.
 */
export async function fetchDashboardSummaryReal(
  scope: DashboardScope = "company",
): Promise<DashboardSummary> {
  const response = await serviceGet<DashboardSummary>(`/dashboard/summary?scope=${scope}`)

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch dashboard summary")
  }

  return response.data as unknown as DashboardSummary
}
