import { serviceGet } from "@/lib/services/baseService"

export interface TeachingMethodCatalogItem {
  id: string
  name: string
}

export async function getTeachingMethodCatalog(): Promise<TeachingMethodCatalogItem[]> {
  const response = await serviceGet<unknown>("/teaching-method/catalog")

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
