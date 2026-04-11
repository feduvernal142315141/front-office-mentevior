import { serviceGet } from "@/lib/services/baseService"
import type { TimingCatalogItem } from "@/lib/types/timing.types"

export async function getTimingCatalog(): Promise<TimingCatalogItem[]> {
  const response = await serviceGet<TimingCatalogItem[]>("/timing/catalog")

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch timing catalog")
  }

  const data = response.data as unknown
  if (Array.isArray(data)) return data as TimingCatalogItem[]

  const paginated = data as { entities?: TimingCatalogItem[] }
  return Array.isArray(paginated.entities) ? paginated.entities : []
}
