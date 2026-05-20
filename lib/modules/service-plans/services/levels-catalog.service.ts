import { serviceGet } from "@/lib/services/baseService"
import type { LevelsLibraryGroup, LevelsLibraryItem } from "@/lib/types/data-collection.types"

/** Display order for level library groups (matches product spec). */
export const LEVELS_LIBRARY_GROUP_ORDER = [
  "Levels of Prompts",
  "Levels of Response",
  "Levels of Intensity",
] as const

export interface LevelCatalogEntry {
  id: string
  level: string
  description: string
  group: string
}

interface LevelCatalogResponse {
  entities?: unknown[]
  data?: unknown[]
  pagination?: {
    page?: number
    pageSize?: number
    total?: number
  }
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}

function extractCatalogEntries(data: unknown): unknown[] {
  if (Array.isArray(data)) return data

  const wrapped = (data && typeof data === "object" ? data : {}) as LevelCatalogResponse
  if (Array.isArray(wrapped.entities)) return wrapped.entities
  if (Array.isArray(wrapped.data)) return wrapped.data

  return []
}

function normalizeLevelCatalogEntry(raw: unknown): LevelCatalogEntry | null {
  if (!raw || typeof raw !== "object") return null

  const entry = raw as Record<string, unknown>
  const id = asString(entry.id)
  const level = asString(entry.level)
  const description = asString(entry.description)
  const group = asString(entry.group)

  if (id.length === 0 || group.length === 0) return null
  if (level.length === 0 && description.length === 0) return null

  return { id, level, description, group }
}

function groupNameToId(groupName: string): string {
  return groupName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function toLibraryItem(entry: LevelCatalogEntry): LevelsLibraryItem {
  return {
    id: entry.id,
    name: entry.description,
    abbreviation: entry.level,
  }
}

function compareGroupOrder(a: string, b: string): number {
  const indexA = LEVELS_LIBRARY_GROUP_ORDER.indexOf(a as (typeof LEVELS_LIBRARY_GROUP_ORDER)[number])
  const indexB = LEVELS_LIBRARY_GROUP_ORDER.indexOf(b as (typeof LEVELS_LIBRARY_GROUP_ORDER)[number])

  const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
  const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB

  if (orderA !== orderB) return orderA - orderB
  return a.localeCompare(b, undefined, { sensitivity: "base" })
}

export function groupLevelCatalogEntries(entries: LevelCatalogEntry[]): LevelsLibraryGroup[] {
  const groupMap = new Map<string, LevelsLibraryItem[]>()

  for (const entry of entries) {
    const items = groupMap.get(entry.group) ?? []
    items.push(toLibraryItem(entry))
    groupMap.set(entry.group, items)
  }

  return Array.from(groupMap.entries())
    .sort(([nameA], [nameB]) => compareGroupOrder(nameA, nameB))
    .map(([name, items]) => ({
      id: groupNameToId(name),
      name,
      items: [...items].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    }))
}

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback
  const payload = data as { message?: unknown; details?: unknown }
  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message
  }
  if (typeof payload.details === "string" && payload.details.trim().length > 0) {
    return payload.details
  }
  return fallback
}

export async function getLevelsCatalog(): Promise<LevelsLibraryGroup[]> {
  const pageSize = 100
  const response = await serviceGet<LevelCatalogResponse>(`/level/catalog?page=0&pageSize=${pageSize}`)

  if (!response || response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch levels catalog"))
  }

  const rawEntries = extractCatalogEntries(response.data)
  const normalized = rawEntries
    .map((entry) => normalizeLevelCatalogEntry(entry))
    .filter((entry): entry is LevelCatalogEntry => entry !== null)

  return groupLevelCatalogEntries(normalized)
}
