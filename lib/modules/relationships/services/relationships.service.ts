import { serviceGet } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"

export interface RelationshipCatalogItem {
  id: string
  name: string
}

function asRelationshipItems(raw: unknown): RelationshipCatalogItem[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { entities?: unknown })?.entities)
      ? ((raw as { entities: unknown[] }).entities)
      : Array.isArray((raw as { data?: unknown })?.data)
        ? ((raw as { data: unknown[] }).data)
        : []

  return list
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      name: typeof item.name === "string" ? item.name : "",
    }))
    .filter((item) => item.id.length > 0)
}

/**
 * Catálogo de relaciones del hogar. Antes leía `response.data.entities` a pelo:
 * si el backend devolvía 200 sin `entities` (o `null`), el create de Assessment
 * montaba MultiSelectWithSearch con `items=undefined` y reventaba en el cliente.
 */
export async function getRelationshipCatalog(): Promise<RelationshipCatalogItem[]> {
  const response = await serviceGet<PaginatedResponse<RelationshipCatalogItem> | RelationshipCatalogItem[]>(
    "/relationship/catalog?page=0&pageSize=200",
  )

  if (response?.status !== 200 || !response.data) {
    const message =
      response?.data && typeof response.data === "object" && "message" in response.data
        ? String((response.data as { message?: unknown }).message ?? "")
        : ""
    throw new Error(message || "Failed to fetch relationship catalog")
  }

  return asRelationshipItems(response.data)
}
