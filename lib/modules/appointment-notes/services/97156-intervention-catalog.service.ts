import { serviceGet } from "@/lib/services/baseService"

export interface InterventionCatalog97156Item {
  id: string
  name: string
}

function extractEntries(data: unknown): InterventionCatalog97156Item[] {
  const entries: unknown[] = (() => {
    if (Array.isArray(data)) return data
    if (data && typeof data === "object") {
      const wrapped = data as { items?: unknown; entities?: unknown; data?: unknown }
      if (Array.isArray(wrapped.entities)) return wrapped.entities
      if (Array.isArray(wrapped.items)) return wrapped.items
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
 * GET /intervention/catalog
 * Returns the 5 fixed intervention options for 97156.
 */
export async function get97156InterventionCatalog(): Promise<InterventionCatalog97156Item[]> {
  const response = await serviceGet<unknown>("/intervention/catalog")
  if (response.status !== 200 || !response.data) return []
  return extractEntries(response.data)
}
