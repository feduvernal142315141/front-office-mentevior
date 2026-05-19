import { serviceGet, servicePut } from "@/lib/services/baseService"
import type {
  DataCollectionConfig,
  DataCollectionLevel,
  ItemDataCollectionConfig,
  UpsertCategoryDataCollectionDto,
  UpsertItemDataCollectionDto,
} from "@/lib/types/data-collection.types"

// ---------------------------------------------------------------------------
// Backend contract (subject to change — only the minimal shape is wired today)
// ---------------------------------------------------------------------------
//   GET  /service-plan-category/{servicePlanCategoryId}/level
//   PUT  /service-plan-category/{servicePlanCategoryId}/level
//   GET  /service-plan-category-item/{servicePlanCategoryItemId}/level
//   PUT  /service-plan-category-item/{servicePlanCategoryItemId}/level
//
// Body shape (both endpoints):
//   { servicePlanCategoryId, typeEventCatalogId, levels: [{ id, level, description }] }
//
// Form fields that are NOT part of the contract yet
// (weeklyDailyValue, intervalLength, unitOfTime, suggestedNumberOfRecordings,
//  cumulative, topography, active) stay in the UI but are not round-tripped.
// When the contract grows, just extend `toApiPayload` / `fromApiResponse`.
// ---------------------------------------------------------------------------

interface ApiLevel {
  id?: string
  level?: string
  description?: string
}

interface ApiPayload {
  servicePlanCategoryId: string
  typeEventCatalogId: string
  levels: Array<{
    id?: string
    level: string
    description: string
  }>
}

interface ApiResponse {
  servicePlanCategoryId?: string
  typeEventCatalogId?: string
  levels?: ApiLevel[]
}

function asString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function asOptionalString(value: unknown): string | undefined {
  const parsed = asString(value).trim()
  return parsed.length > 0 ? parsed : undefined
}

function extractEntity(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw

  const wrapped = raw as { entity?: unknown; data?: unknown }
  if (wrapped.entity && typeof wrapped.entity === "object") return wrapped.entity
  if (wrapped.data && typeof wrapped.data === "object") {
    const dataEntity = (wrapped.data as { entity?: unknown }).entity
    if (dataEntity && typeof dataEntity === "object") return dataEntity
    return wrapped.data
  }

  return raw
}

function normalizeLevels(rawLevels: unknown): DataCollectionLevel[] {
  if (!Array.isArray(rawLevels)) return []

  return rawLevels
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null

      const level = entry as ApiLevel
      const label = asString(level.level)
      const description = asString(level.description)
      const id = asOptionalString(level.id)

      if (label.length === 0 && description.length === 0) return null

      return {
        id: id ?? crypto.randomUUID(),
        label,
        description,
      } satisfies DataCollectionLevel
    })
    .filter((entry): entry is DataCollectionLevel => entry !== null)
}

function fromApiResponse(raw: unknown): DataCollectionConfig | null {
  const entity = extractEntity(raw)
  if (!entity || typeof entity !== "object") return null

  const response = entity as ApiResponse
  const typeEventCatalogId = asString(response.typeEventCatalogId)
  const levels = normalizeLevels(response.levels)

  if (typeEventCatalogId.length === 0 && levels.length === 0) return null

  return {
    type: typeEventCatalogId,
    levels,
  }
}

function toApiPayload(
  dto: UpsertCategoryDataCollectionDto | UpsertItemDataCollectionDto
): ApiPayload {
  return {
    servicePlanCategoryId: dto.servicePlanCategoryId,
    typeEventCatalogId: dto.type,
    levels: dto.levels.map((level) => ({
      level: level.label,
      description: level.description,
    })),
  }
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

// --- Category-level ---------------------------------------------------------

export async function getCategoryDataCollection(
  servicePlanCategoryId: string
): Promise<DataCollectionConfig | null> {
  const response = await serviceGet<unknown>(
    `/service-plan-category/${servicePlanCategoryId}/level`
  )

  if (response?.status === 404) return null

  if (!response || (response.status !== 200 && response.status !== 204)) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to load category data collection")
    )
  }

  if (response.status === 204 || !response.data) return null

  return fromApiResponse(response.data)
}

export async function upsertCategoryDataCollection(
  dto: UpsertCategoryDataCollectionDto
): Promise<void> {
  const payload = toApiPayload(dto)
  const response = await servicePut<ApiPayload, unknown>(
    `/service-plan-category/${dto.servicePlanCategoryId}/level`,
    payload
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to save category data collection")
    )
  }
}

// --- Item-level -------------------------------------------------------------

export async function getItemDataCollection(
  servicePlanCategoryItemId: string
): Promise<ItemDataCollectionConfig | null> {
  const response = await serviceGet<unknown>(
    `/service-plan-category-item/${servicePlanCategoryItemId}/level`
  )

  if (response?.status === 404) return null

  if (!response || (response.status !== 200 && response.status !== 204)) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to load item data collection")
    )
  }

  if (response.status === 204 || !response.data) return null

  const base = fromApiResponse(response.data)
  if (!base) return null

  // Extra fields (itemName, categoryName, topography, active) are not part of
  // the current contract — the drawer fills the visible name from props and
  // defaults topography/active until the contract grows.
  return {
    ...base,
    itemId: "",
    itemName: "",
    categoryId: "",
    categoryName: "",
    topography: "",
    active: true,
    isCustomOverride: true,
  }
}

export async function upsertItemDataCollection(
  dto: UpsertItemDataCollectionDto
): Promise<void> {
  const payload = toApiPayload(dto)
  const response = await servicePut<ApiPayload, unknown>(
    `/service-plan-category-item/${dto.servicePlanCategoryItemId}/level`,
    payload
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to save item data collection")
    )
  }
}
