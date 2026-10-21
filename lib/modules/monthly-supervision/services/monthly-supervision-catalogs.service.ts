import { serviceGet } from "@/lib/services/baseService"
import type { SupervisionOptionCatalogItem } from "@/lib/types/monthly-supervision.types"

/**
 * Catálogos de opciones del Monthly Supervision.
 *
 * Cada endpoint devuelve `[]` ante cualquier fallo para que el formulario
 * pueda mostrar el resto del reporte y permita agregar opciones manualmente.
 */

const DOCUMENT_OPTIONS_URL = "/monthly-supervision-document-option/catalog"
const APPLIED_OPTIONS_URL = "/monthly-supervision-applied-option/catalog"
const CONDUCTED_OPTIONS_URL = "/monthly-supervision-conducted-option/catalog"
const EVALUATION_OPTIONS_URL = "/monthly-supervision-evaluation-option/catalog"

/** `pageSize=0` devuelve todo el catálogo, según el contrato */
const QUERY = "?page=0&pageSize=0"

type Json = Record<string, unknown>

function extractEntities(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    const wrapped = data as { entities?: unknown; items?: unknown; data?: unknown }
    if (Array.isArray(wrapped.entities)) return wrapped.entities
    if (Array.isArray(wrapped.items)) return wrapped.items
    if (Array.isArray(wrapped.data)) return wrapped.data
  }
  return []
}

function toItem(raw: unknown, index: number): SupervisionOptionCatalogItem | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Json

  const id = String(record.id ?? "").trim()
  const name = String(record.name ?? "").trim()
  if (!id || !name) return null

  const sortOrder = Number(record.sortOrder)

  return {
    id,
    code: String(record.code ?? "").trim(),
    name,
    // Sin `sortOrder` se conserva el orden en que vino, que ya es el del backend
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : index,
  }
}

async function fetchCatalog(url: string): Promise<SupervisionOptionCatalogItem[]> {
  const response = await serviceGet<unknown>(`${url}${QUERY}`)

  if (response?.status !== 200 || !response.data) return []

  return extractEntities(response.data)
    .map(toItem)
    .filter((item): item is SupervisionOptionCatalogItem => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

/** Documentos revisados — ids que viajan en `documentOptionCatalogIds` */
export function getDocumentOptionCatalog(): Promise<SupervisionOptionCatalogItem[]> {
  return fetchCatalog(DOCUMENT_OPTIONS_URL)
}

/** Actividades aplicadas — ids que viajan en `appliedOptionCatalogIds` */
export function getAppliedOptionCatalog(): Promise<SupervisionOptionCatalogItem[]> {
  return fetchCatalog(APPLIED_OPTIONS_URL)
}

export function getConductedOptionCatalog(): Promise<SupervisionOptionCatalogItem[]> {
  return fetchCatalog(CONDUCTED_OPTIONS_URL)
}

export function getEvaluationOptionCatalog(): Promise<SupervisionOptionCatalogItem[]> {
  return fetchCatalog(EVALUATION_OPTIONS_URL)
}
