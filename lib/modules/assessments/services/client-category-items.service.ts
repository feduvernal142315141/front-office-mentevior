import { serviceGet } from "@/lib/services/baseService"
import type { ClientCategoryWithItems } from "@/lib/types/assessment.types"

/**
 * Categorías + items activos del ClientServicePlan activo del cliente.
 * Alimenta la sección Categories & Items del Assessment. Un cliente sin SP
 * activo responde 200 con lista vacía (no es un error).
 */
export async function getClientCategoryItems(clientId: string): Promise<ClientCategoryWithItems[]> {
  const response = await serviceGet<ClientCategoryWithItems[]>(
    `/client-service-plan/client/${clientId}/category-items`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch client category items")
  }

  const data = response.data as unknown
  return Array.isArray(data) ? (data as ClientCategoryWithItems[]) : []
}
