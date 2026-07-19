import { serviceGet } from "@/lib/services/baseService"
import type { InterventionCatalogItem } from "@/lib/types/appointment-note.types"

function extractCatalogEntries(data: unknown): InterventionCatalogItem[] {
  const entries: unknown[] = (() => {
    if (Array.isArray(data)) return data
    if (data && typeof data === "object") {
      const wrapped = data as { items?: unknown; entities?: unknown; data?: unknown }
      if (Array.isArray(wrapped.items)) return wrapped.items
      if (Array.isArray(wrapped.entities)) return wrapped.entities
      if (Array.isArray(wrapped.data)) return wrapped.data
    }
    return []
  })()

  return entries
    .filter((e) => e && typeof e === "object")
    .map((e) => {
      const item = e as Record<string, unknown>
      return {
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
      }
    })
    .filter((item) => item.id.length > 0 && item.name.length > 0)
}

/**
 * Fetch antecedent intervention catalog (read-only seed data).
 * GET /antecedent-intervention/catalog
 */
export async function getAntecedentInterventionCatalog(): Promise<InterventionCatalogItem[]> {
  const response = await serviceGet<unknown>("/antecedent-intervention/catalog")
  if (response.status !== 200 || !response.data) return []
  return extractCatalogEntries(response.data)
}

/**
 * Fetch consequence intervention catalog (read-only seed data).
 * GET /consequence-intervention/catalog
 */
export async function getConsequenceInterventionCatalog(): Promise<InterventionCatalogItem[]> {
  const response = await serviceGet<unknown>("/consequence-intervention/catalog")
  if (response.status !== 200 || !response.data) return []
  return extractCatalogEntries(response.data)
}
