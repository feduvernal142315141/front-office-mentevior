import { serviceGet } from "@/lib/services/baseService"

export interface PeriodCatalogItem {
  id: string
  name: string
}

export async function getPeriodCatalog(): Promise<PeriodCatalogItem[]> {
  const response = await serviceGet<unknown>("/period/catalog")

  if (response.status !== 200 || !response.data) return []

  const data = response.data as { entities?: unknown[] }
  const entries = Array.isArray(data.entities) ? data.entities : []

  return entries
    .map((entry) => {
      const item = entry as Record<string, unknown>
      const id = typeof item.id === "string" ? item.id : ""
      const name = typeof item.name === "string" ? item.name : ""
      return { id, name }
    })
    .filter((item) => item.id.length > 0 && item.name.length > 0)
}
