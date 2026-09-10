import { serviceGet } from "@/lib/services/baseService"
import type { AssessmentCatalogItem, IntensityCatalogItem } from "@/lib/types/assessment.types"
import type { PaginatedResponse } from "@/lib/types/response.types"

/**
 * Los dos catálogos compartían el contrato paginado estándar. El `pageSize` por
 * defecto documentado es `0` y no está confirmado que signifique "todos"
 * (Q5 en plans/assessment.md), así que se pide un tope explícito holgado y se
 * reordena por `sortOrder` en el front como red de seguridad.
 */
async function getCatalog(path: string, label: string): Promise<AssessmentCatalogItem[]> {
  const response = await serviceGet<PaginatedResponse<AssessmentCatalogItem>>(`${path}?page=0&pageSize=200`)

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || `Failed to fetch ${label}`)
  }

  const entities = (response.data as unknown as PaginatedResponse<AssessmentCatalogItem>).entities
  if (!Array.isArray(entities)) return []

  return [...entities]
    .filter((item): item is AssessmentCatalogItem => Boolean(item?.id))
    .map((item) => ({
      ...item,
      name: typeof item.name === "string" ? item.name : "",
    }))
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
}

export function getGradeCatalog(): Promise<AssessmentCatalogItem[]> {
  return getCatalog("/grade/catalog", "grade catalog")
}

export function getAssessmentConductedCatalog(): Promise<AssessmentCatalogItem[]> {
  return getCatalog("/assessment-conducted/catalog", "assessment conducted catalog")
}

/**
 * `GET /intensity/catalog` — Mild (L1) / Moderate (L2) / Severe (L3) con
 * description. El Assessment sigue guardando name + description como strings.
 */
export async function getIntensityCatalog(): Promise<IntensityCatalogItem[]> {
  const response = await serviceGet<PaginatedResponse<IntensityCatalogItem>>(
    `/intensity/catalog?page=0&pageSize=200`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch intensity catalog")
  }

  const entities = (response.data as unknown as PaginatedResponse<IntensityCatalogItem>).entities
  if (!Array.isArray(entities)) return []

  return [...entities]
    .filter((item): item is IntensityCatalogItem => Boolean(item?.id))
    .map((item) => ({
      id: item.id,
      name: typeof item.name === "string" ? item.name : "",
      description: typeof item.description === "string" ? item.description : "",
    }))
    .filter((item) => item.name)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}
