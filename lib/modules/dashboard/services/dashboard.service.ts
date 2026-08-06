import { serviceGetSilent } from "@/lib/services/baseService"
import type { DashboardScope, DashboardSummary } from "@/lib/types/dashboard.types"
import { normalizeDashboardSummary } from "../utils/normalize-summary"
import { DashboardError, dashboardErrorFromResponse } from "./dashboard-error"

/**
 * Servicio real del dashboard — `GET /dashboard/summary?scope=`.
 *
 * Un único agregado ya scope-eado por rol. La alternativa (pegarle a cada
 * módulo) son 6+ requests paginados sólo para contar, y el `total` de paginación
 * no es confiable de forma pareja en todos los listados.
 *
 * Va **silencioso** a propósito: el dashboard pinta su propio estado de error
 * con una acción de reintento, así que el toast global sería un segundo aviso
 * del mismo problema.
 *
 * Contrato: `docs/dashboard-summary-backend.md` · plan: `plans/dashboard.md` §5.4.
 */
export async function fetchDashboardSummaryReal(
  scope: DashboardScope = "company",
): Promise<DashboardSummary> {
  const response = await serviceGetSilent<DashboardSummary>(`/dashboard/summary?scope=${scope}`)

  // El interceptor devuelve `err.response`, que es `undefined` si el request ni
  // salió (servidor caído, DNS, offline).
  if (!response) {
    throw dashboardErrorFromResponse(null, null)
  }

  if (response.status !== 200 || !response.data) {
    const error = dashboardErrorFromResponse(response.status ?? null, response.data)
    // El detalle técnico no llega a la pantalla; a la consola sí, que es donde
    // se busca cuando alguien reporta "el dashboard no carga".
    if (error.technicalDetail) {
      console.error(`[Dashboard] ${error.status} on /dashboard/summary:`, error.technicalDetail)
    }
    throw error
  }

  try {
    return normalizeDashboardSummary(response.data)
  } catch (error) {
    throw new DashboardError({
      kind: "unknown",
      status: response.status,
      title: "We couldn't read the dashboard data",
      message: error instanceof Error ? error.message : "Unexpected response shape.",
      canRetry: true,
    })
  }
}
