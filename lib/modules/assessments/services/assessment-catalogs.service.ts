import { serviceGet } from "@/lib/services/baseService"
import type { AssessmentCatalogItem } from "@/lib/types/assessment.types"
import type { PaginatedResponse } from "@/lib/types/response.types"

/**
 * Los dos catálogos comparten el contrato paginado estándar. El `pageSize` por
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

  return [...entities].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
}

export function getGradeCatalog(): Promise<AssessmentCatalogItem[]> {
  return getCatalog("/grade/catalog", "grade catalog")
}

export function getAssessmentConductedCatalog(): Promise<AssessmentCatalogItem[]> {
  return getCatalog("/assessment-conducted/catalog", "assessment conducted catalog")
}
