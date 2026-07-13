import { serviceGet } from "@/lib/services/baseService"

export interface ObjectiveStatusCatalogItem {
  id: string
  name: string
}

/**
 * Fetch objective status catalog via GET /objective-status/catalog.
 * Replaces the old GET /status-service-plan/catalog.
 */
export async function getObjectiveStatusCatalog(): Promise<ObjectiveStatusCatalogItem[]> {
  const response = await serviceGet<unknown>("/objective-status/catalog")

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch objective status catalog")
  }

  const data = response.data as unknown

  // Handle paginated response { entities: [...] }
  if (data && typeof data === "object" && "entities" in (data as object)) {
    const entities = (data as { entities?: unknown }).entities
    if (Array.isArray(entities)) {
      return entities
        .filter((e) => e && typeof e === "object")
        .map((e) => {
          const item = e as Record<string, unknown>
          return {
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
          }
        })
        .filter((item) => item.id.length > 0)
    }
  }

  // Handle direct array
  if (Array.isArray(data)) {
    return data
      .filter((e) => e && typeof e === "object")
      .map((e) => {
        const item = e as Record<string, unknown>
        return {
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
        }
      })
      .filter((item) => item.id.length > 0)
  }

  return []
}
