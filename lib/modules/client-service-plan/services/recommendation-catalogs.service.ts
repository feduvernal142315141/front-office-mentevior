import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"

function asString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function asOptionalString(value: unknown): string | undefined {
  const parsed = asString(value).trim()
  return parsed.length > 0 ? parsed : undefined
}

function extractEntries(rawData: unknown): unknown[] {
  if (Array.isArray(rawData)) return rawData
  const wrapped = (rawData && typeof rawData === "object" ? rawData : {}) as {
    entities?: unknown
    data?: unknown
  }
  if (Array.isArray(wrapped.entities)) return wrapped.entities
  if (Array.isArray(wrapped.data)) return wrapped.data
  return []
}

function normalizeCatalogItem(raw: unknown): RecommendationCatalogItem | null {
  if (!raw || typeof raw !== "object") return null
  const item = raw as Record<string, unknown>
  const id = asString(item.id)
  const name = asString(item.name)
  if (!id || !name) return null
  return {
    id,
    name,
    group: asOptionalString(item.group ?? item.category ?? item.type),
  }
}

function extractCreatedId(data: unknown): string {
  if (typeof data === "string" && data.trim().length > 0) return data.trim().replace(/^"|"$/g, "")
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    const id = asString(obj.id ?? obj.Id ?? "")
    if (id) return id
    const entity = (obj.entity ?? obj.data) as Record<string, unknown> | undefined
    if (entity && typeof entity === "object") {
      const nestedId = asString(entity.id ?? entity.Id ?? "")
      if (nestedId) return nestedId
    }
  }
  return ""
}

function normalizeCatalogCollection(rawData: unknown): RecommendationCatalogItem[] {
  return extractEntries(rawData)
    .map(normalizeCatalogItem)
    .filter((item): item is RecommendationCatalogItem => item !== null)
}

// --- Strategy (read-only) ---

export async function getStrategyCatalog(): Promise<RecommendationCatalogItem[]> {
  const response = await serviceGet<unknown>("/strategy/catalog")
  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch strategy catalog")
  }
  return normalizeCatalogCollection(response.data)
}

// --- Activities Implemented ---

export async function getActivitiesImplementedCatalog(): Promise<RecommendationCatalogItem[]> {
  const response = await serviceGet<unknown>("/activities-implemented/catalog")
  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch activities implemented catalog")
  }
  return normalizeCatalogCollection(response.data)
}

export async function createActivityImplemented(name: string): Promise<string> {
  const response = await servicePost<{ name: string }, unknown>("/activities-implemented", { name })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to create activity"
    )
  }
  return extractCreatedId(response.data)
}

export async function updateActivityImplemented(id: string, name: string): Promise<void> {
  const response = await servicePut<{ id: string; name: string }, unknown>("/activities-implemented", { id, name })
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to update activity"
    )
  }
}

export async function deleteActivityImplemented(id: string): Promise<void> {
  const response = await serviceDelete<never, unknown>(`/activities-implemented/${id}`)
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to delete activity"
    )
  }
}

// --- Preventive Strategies ---

export async function getPreventiveStrategiesCatalog(): Promise<RecommendationCatalogItem[]> {
  const response = await serviceGet<unknown>("/preventive-strategy/catalog")
  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch preventive strategies catalog")
  }
  return normalizeCatalogCollection(response.data)
}

export async function createPreventiveStrategy(name: string): Promise<string> {
  const response = await servicePost<{ name: string }, unknown>("/preventive-strategy", { name })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to create preventive strategy"
    )
  }
  return extractCreatedId(response.data)
}

export async function updatePreventiveStrategy(id: string, name: string): Promise<void> {
  const response = await servicePut<{ id: string; name: string }, unknown>("/preventive-strategy", { id, name })
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to update preventive strategy"
    )
  }
}

export async function deletePreventiveStrategy(id: string): Promise<void> {
  const response = await serviceDelete<never, unknown>(`/preventive-strategy/${id}`)
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to delete preventive strategy"
    )
  }
}

// --- Interventions ---

export async function getInterventionsCatalog(): Promise<RecommendationCatalogItem[]> {
  const response = await serviceGet<unknown>("/intervention/catalog")
  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch interventions catalog")
  }
  return normalizeCatalogCollection(response.data)
}

export async function createIntervention(name: string): Promise<string> {
  const response = await servicePost<{ name: string }, unknown>("/intervention", { name })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to create intervention"
    )
  }
  return extractCreatedId(response.data)
}

export async function updateIntervention(id: string, name: string): Promise<void> {
  const response = await servicePut<{ id: string; name: string }, unknown>("/intervention", { id, name })
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to update intervention"
    )
  }
}

export async function deleteIntervention(id: string): Promise<void> {
  const response = await serviceDelete<never, unknown>(`/intervention/${id}`)
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to delete intervention"
    )
  }
}

// --- Reinforcers ---

export async function getReinforcersCatalog(): Promise<RecommendationCatalogItem[]> {
  const response = await serviceGet<unknown>("/reinforcers/catalog")
  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch reinforcers catalog")
  }
  return normalizeCatalogCollection(response.data)
}

export async function createReinforcer(name: string, group: string): Promise<void> {
  const response = await servicePost<{ name: string; group: string }, unknown>("/reinforcers", { name, group })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to create reinforcer"
    )
  }
}

export async function updateReinforcer(id: string, name: string, group: string): Promise<void> {
  const response = await servicePut<{ id: string; name: string; group: string }, unknown>("/reinforcers", { id, name, group })
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to update reinforcer"
    )
  }
}

export async function deleteReinforcer(id: string): Promise<void> {
  const response = await serviceDelete<never, unknown>(`/reinforcers/${id}`)
  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to delete reinforcer"
    )
  }
}

// --- Replacements (read-only) ---

export async function getReplacementsCatalog(): Promise<RecommendationCatalogItem[]> {
  const response = await serviceGet<unknown>("/replacement/catalog")
  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch replacements catalog")
  }
  return normalizeCatalogCollection(response.data)
}
