import { serviceGet } from "@/lib/services/baseService"

export interface DatasetCatalogEntry {
  id: string
  name: string
  description: string
}

interface DatasetsCatalogResponse {
  entities: DatasetCatalogEntry[]
  pagination?: { page: number; pageSize: number; total: number }
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}

function normalizeEntry(raw: unknown): DatasetCatalogEntry | null {
  if (!raw || typeof raw !== "object") return null
  const entry = raw as Record<string, unknown>
  const id = asString(entry.id)
  const name = asString(entry.name)
  if (!id || !name) return null
  return {
    id,
    name,
    description: asString(entry.description),
  }
}

export async function getDatasetsCatalog(): Promise<DatasetCatalogEntry[]> {
  const response = await serviceGet<DatasetsCatalogResponse>(
    "/datasets/catalog?page=0&pageSize=0"
  )

  if (!response || response.status !== 200) {
    throw new Error("Failed to fetch datasets catalog")
  }

  const entities = response.data?.entities ?? []
  return entities
    .map((entry) => normalizeEntry(entry))
    .filter((entry): entry is DatasetCatalogEntry => entry !== null)
}
