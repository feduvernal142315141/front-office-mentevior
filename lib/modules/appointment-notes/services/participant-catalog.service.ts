import { serviceGet } from "@/lib/services/baseService"
import type { ParticipantCatalogItem, AppointmentNoteParticipantCatalogType } from "@/lib/types/appointment-note.types"

/**
 * GET /appointment-note-participant/catalogs
 * Returns combined participant catalog (Member User Type + Relationship).
 */
export async function getParticipantCatalog(): Promise<ParticipantCatalogItem[]> {
  const response = await serviceGet<unknown>("/appointment-note-participant/catalogs")

  if (response.status !== 200 || !response.data) return []

  const data = response.data as unknown
  const arr = Array.isArray(data)
    ? data
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
      const rawType = String(rec.type ?? "")
      const type: AppointmentNoteParticipantCatalogType =
        rawType.toLowerCase().includes("relationship") ? "Relationship" : "Member User Type"
      return { id, name, type }
    })
    .filter((r): r is ParticipantCatalogItem => r !== null)
}
