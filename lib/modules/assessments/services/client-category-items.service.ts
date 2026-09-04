import { serviceGet } from "@/lib/services/baseService"
import type {
  ClientCategoryItemSummary,
  ClientCategoryWithItems,
} from "@/lib/types/assessment.types"
import { parseHypothesizedFunction } from "@/lib/constants/hypothesized-function"

/**
 * `hypothesizedFunction` es el valor configurado en el item del Service Plan y
 * hace de precarga del Assessment (contrato 2026-09-03); el usuario puede
 * cambiarlo para ese Assessment sin tocar el Service Plan.
 */
function normalizeItem(raw: unknown): ClientCategoryItemSummary {
  const entry = (raw ?? {}) as Record<string, unknown>
  return {
    id: typeof entry.id === "string" ? entry.id : "",
    name: typeof entry.name === "string" ? entry.name : "",
    hypothesizedFunction: parseHypothesizedFunction(entry.hypothesizedFunction),
  }
}

/**
 * Categorías + items activos del ClientServicePlan activo del cliente.
 * Alimenta la sección Categories & Items del Assessment. Un cliente sin SP
 * activo responde 200 con lista vacía (no es un error).
 *
 * Contrato 2026-09-03: se pasó de `/category-items` a `/assessment-data`, que es
 * el único que trae `hypothesizedFunction` por item. La respuesta llega como
 * `{ categories: [...] }`; se acepta también el array plano del endpoint viejo.
 */
export async function getClientCategoryItems(clientId: string): Promise<ClientCategoryWithItems[]> {
  const response = await serviceGet<unknown>(
    `/client-service-plan/client/${clientId}/assessment-data`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch client category items")
  }

  const data = response.data as unknown
  const categories = Array.isArray(data)
    ? data
    : (data as { categories?: unknown })?.categories

  if (!Array.isArray(categories)) return []

  return categories.map((raw) => {
    const entry = (raw ?? {}) as Record<string, unknown>
    return {
      id: typeof entry.id === "string" ? entry.id : "",
      name: typeof entry.name === "string" ? entry.name : "",
      items: Array.isArray(entry.items) ? entry.items.map(normalizeItem) : [],
    }
  })
}
