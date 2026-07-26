import { serviceGet } from "@/lib/services/baseService"
import type { CatalogItem } from "@/lib/types/appointment-note-97155.types"

function extractCatalogItems(data: unknown): CatalogItem[] {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as { entities?: unknown }).entities)
      ? (data as { entities: unknown[] }).entities
      : Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : []

  return arr
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null
      const rec = item as Record<string, unknown>
      const id = String(rec.id ?? "")
      const name = String(rec.name ?? "")
      if (!id || !name) return null
      return { id, name }
    })
    .filter((r): r is CatalogItem => r !== null)
}

/** GET /protocol-observation-outcome/catalog */
export async function getProtocolObservationCatalog(): Promise<CatalogItem[]> {
  const response = await serviceGet<unknown>("/protocol-observation-outcome/catalog")
  if (response.status !== 200 || !response.data) return []
  return extractCatalogItems(response.data)
}

/** GET /protocol-adjustment/catalog */
export async function getProtocolAdjustmentCatalog(): Promise<CatalogItem[]> {
  const response = await serviceGet<unknown>("/protocol-adjustment/catalog")
  if (response.status !== 200 || !response.data) return []
  return extractCatalogItems(response.data)
}

/** GET /qhp-implementation/catalog */
export async function getQhpImplementationCatalog(): Promise<CatalogItem[]> {
  const response = await serviceGet<unknown>("/qhp-implementation/catalog")
  if (response.status !== 200 || !response.data) return []
  return extractCatalogItems(response.data)
}

/** GET /active-direction/catalog */
export async function getActiveDirectionCatalog(): Promise<CatalogItem[]> {
  const response = await serviceGet<unknown>("/active-direction/catalog")
  if (response.status !== 200 || !response.data) return []
  return extractCatalogItems(response.data)
}
