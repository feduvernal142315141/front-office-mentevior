import { serviceGet } from "@/lib/services/baseService"

export interface TeachingProcedureCatalogItem {
  id: string
  name: string
}

/**
 * GET /teaching-procedure/catalog
 * Catalog for Client Service Plan item-level configuration.
 */
export async function getTeachingProcedureCatalog(): Promise<TeachingProcedureCatalogItem[]> {
  const response = await serviceGet<unknown>("/teaching-procedure/catalog")

  if (response.status !== 200 || !response.data) return []

  const data = response.data as { entities?: unknown[]; data?: unknown[] }
  const entries = Array.isArray(data.entities)
    ? data.entities
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(response.data)
        ? (response.data as unknown[])
        : []

  return entries
    .map((entry) => {
      const item = entry as Record<string, unknown>
      const id = typeof item.id === "string" ? item.id : ""
      const name = typeof item.name === "string" ? item.name : ""
      return { id, name }
    })
    .filter((item) => item.id.length > 0 && item.name.length > 0)
}
