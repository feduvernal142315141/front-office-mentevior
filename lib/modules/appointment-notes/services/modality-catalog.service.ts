import { serviceGet } from "@/lib/services/baseService"
import type { ModalityCatalogItem } from "@/lib/types/appointment-note.types"

/**
 * GET /modality/catalog
 * Returns available session modalities (In-Person, Telehealth, etc.).
 */
export async function getModalityCatalog(): Promise<ModalityCatalogItem[]> {
  const response = await serviceGet<unknown>("/modality/catalog")

  if (response.status !== 200 || !response.data) return []

  const data = response.data as unknown
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
    .filter((r): r is ModalityCatalogItem => r !== null)
}
