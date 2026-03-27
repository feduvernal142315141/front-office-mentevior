import { serviceGet } from "@/lib/services/baseService"
import type { CurrencyCatalogItem } from "@/lib/types/currency.types"

export async function getCurrencyCatalog(): Promise<CurrencyCatalogItem[]> {
  const response = await serviceGet<CurrencyCatalogItem[]>("/currency/catalog")

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch currency catalog")
  }

  const data = response.data as unknown
  if (Array.isArray(data)) return data as CurrencyCatalogItem[]

  const paginated = data as { entities?: CurrencyCatalogItem[] }
  return Array.isArray(paginated.entities) ? paginated.entities : []
}
