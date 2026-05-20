import {
  parseServicePlanUnitOfTime,
  parseServicePlanValueType,
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { serviceDelete, serviceGet, servicePut } from "@/lib/services/baseService"
import type {
  DataCollectionConfig,
  DataCollectionLevel,
  DataCollectionType,
  ItemDataCollectionConfig,
  UpsertCategoryDataCollectionDto,
  UpsertItemDataCollectionDto,
} from "@/lib/types/data-collection.types"

interface ApiLevel {
  id?: string
  level?: string
  description?: string
}

interface ApiDataCollection {
  typeEventCatalogId?: string
  dailyValue?: ServicePlanValueType
  weeklyValue?: ServicePlanValueType
  unitOfTime?: ServicePlanUnitOfTime
  unitMeasurementCatalogId?: string
  recordingsNumber?: number
  intervalLength?: number
  levels?: ApiLevel[]
}

interface ApiCategoryPayload {
  servicePlanCategoryId: string
  dataCollection: ApiDataCollection
}

interface ApiCategoryResponse {
  servicePlanCategoryId?: string
  dataCollection?: ApiDataCollection
  typeEventCatalogId?: string
  dailyValue?: ServicePlanValueType
  weeklyValue?: ServicePlanValueType
  unitOfTime?: ServicePlanUnitOfTime
  unitMeasurementCatalogId?: string
  recordingsNumber?: number
  intervalLength?: number
  levels?: ApiLevel[]
}

interface ApiItemPayload {
  servicePlanCategoryItemId: string
  name?: string
  topography: string
  status: boolean
  dataCollection: ApiDataCollection
}

interface ApiItemResponse {
  servicePlanCategoryItemId?: string
  name?: string
  topography?: string
  status?: boolean
  dataCollection?: ApiDataCollection
  typeEventCatalogId?: string
  dailyValue?: ServicePlanValueType
  weeklyValue?: ServicePlanValueType
  unitOfTime?: ServicePlanUnitOfTime
  unitMeasurementCatalogId?: string
  recordingsNumber?: number
  intervalLength?: number
  levels?: ApiLevel[]
}

type DataCollectionDtoFields = {
  type: DataCollectionType
  weeklyDailyValue?: ServicePlanValueType
  dailyValue?: ServicePlanValueType
  unitMeasurementCatalogId?: string
  levels: UpsertCategoryDataCollectionDto["levels"]
  intervalLength?: number
  unitOfTime?: ServicePlanUnitOfTime
  suggestedNumberOfRecordings?: number
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

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
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
        id: crypto.randomUUID(),
        ...(id ? { recordId: id } : {}),
        label,
        description,
      } satisfies DataCollectionLevel
    })
    .filter((entry): entry is DataCollectionLevel => entry !== null)
}

function extractApiDataCollection(
  response: ApiCategoryResponse | ApiItemResponse
): ApiDataCollection | null {
  if (response.dataCollection && typeof response.dataCollection === "object") {
    return response.dataCollection
  }

  const typeEventCatalogId = asOptionalString(response.typeEventCatalogId)
  const hasLegacyFields =
    typeEventCatalogId ||
    response.dailyValue ||
    response.weeklyValue ||
    response.unitOfTime ||
    asOptionalString(response.unitMeasurementCatalogId) ||
    response.recordingsNumber !== undefined ||
    response.intervalLength !== undefined ||
    (Array.isArray(response.levels) && response.levels.length > 0)

  if (!hasLegacyFields) return null

  return {
    typeEventCatalogId,
    dailyValue: response.dailyValue,
    weeklyValue: response.weeklyValue,
    unitOfTime: response.unitOfTime,
    unitMeasurementCatalogId: asOptionalString(response.unitMeasurementCatalogId),
    recordingsNumber: response.recordingsNumber,
    intervalLength: response.intervalLength,
    levels: response.levels,
  }
}

function fromApiDataCollection(dc: ApiDataCollection): DataCollectionConfig {
  const typeEventCatalogId = asString(dc.typeEventCatalogId)
  const dailyValue = parseServicePlanValueType(dc.dailyValue)
  const weeklyDailyValue = parseServicePlanValueType(dc.weeklyValue)
  const unitOfTime = parseServicePlanUnitOfTime(dc.unitOfTime)
  const unitMeasurementCatalogId = asOptionalString(dc.unitMeasurementCatalogId)
  const suggestedNumberOfRecordings = asOptionalNumber(dc.recordingsNumber)
  const intervalLength = asOptionalNumber(dc.intervalLength)
  const levels = normalizeLevels(dc.levels)

  return {
    type: typeEventCatalogId,
    dailyValue,
    weeklyDailyValue,
    unitOfTime,
    unitMeasurementCatalogId,
    suggestedNumberOfRecordings,
    intervalLength,
    levels,
  }
}

function hasDataCollectionContent(config: DataCollectionConfig): boolean {
  return (
    config.type.length > 0 ||
    config.levels.length > 0 ||
    config.dailyValue !== undefined ||
    config.weeklyDailyValue !== undefined ||
    config.unitOfTime !== undefined ||
    config.unitMeasurementCatalogId !== undefined ||
    config.suggestedNumberOfRecordings !== undefined ||
    config.intervalLength !== undefined
  )
}

function fromApiCategoryResponse(raw: unknown): DataCollectionConfig | null {
  const entity = extractEntity(raw)
  if (!entity || typeof entity !== "object") return null

  const dataCollection = extractApiDataCollection(entity as ApiCategoryResponse)
  if (!dataCollection) return null

  const config = fromApiDataCollection(dataCollection)
  return hasDataCollectionContent(config) ? config : null
}

function fromApiItemResponse(
  raw: unknown,
  fallbackItemId: string
): ItemDataCollectionConfig | null {
  const entity = extractEntity(raw)
  if (!entity || typeof entity !== "object") return null

  const itemEntity = entity as ApiItemResponse
  const dataCollection = extractApiDataCollection(itemEntity)
  const topography = asString(itemEntity.topography)
  const active = typeof itemEntity.status === "boolean" ? itemEntity.status : true
  const name = asString(itemEntity.name)
  const itemId = asOptionalString(itemEntity.servicePlanCategoryItemId) ?? fallbackItemId

  const base = dataCollection
    ? fromApiDataCollection(dataCollection)
    : { type: "", levels: [] as DataCollectionLevel[] }

  const hasContent =
    hasDataCollectionContent(base) ||
    topography.length > 0 ||
    typeof itemEntity.status === "boolean"

  if (!hasContent) return null

  return {
    ...base,
    itemId,
    itemName: name,
    categoryId: "",
    categoryName: "",
    topography,
    active,
    isCustomOverride: !!dataCollection && hasDataCollectionContent(base),
  }
}

function toApiDataCollection(dto: DataCollectionDtoFields): ApiDataCollection {
  const dataCollection: ApiDataCollection = {
    typeEventCatalogId: dto.type,
    levels: dto.levels.map((level) => {
      const entry: ApiLevel = {
        level: level.label,
        description: level.description,
      }
      if (level.id) entry.id = level.id
      return entry
    }),
  }

  if (dto.dailyValue) {
    dataCollection.dailyValue = dto.dailyValue
  }
  if (dto.weeklyDailyValue) {
    dataCollection.weeklyValue = dto.weeklyDailyValue
  }
  if (dto.unitOfTime) {
    dataCollection.unitOfTime = dto.unitOfTime
  }
  if (dto.unitMeasurementCatalogId) {
    dataCollection.unitMeasurementCatalogId = dto.unitMeasurementCatalogId
  }
  if (dto.suggestedNumberOfRecordings !== undefined) {
    dataCollection.recordingsNumber = dto.suggestedNumberOfRecordings
  }
  if (dto.intervalLength !== undefined) {
    dataCollection.intervalLength = dto.intervalLength
  }

  return dataCollection
}

function toApiCategoryPayload(dto: UpsertCategoryDataCollectionDto): ApiCategoryPayload {
  return {
    servicePlanCategoryId: dto.servicePlanCategoryId,
    dataCollection: toApiDataCollection(dto),
  }
}

function toApiItemPayload(dto: UpsertItemDataCollectionDto): ApiItemPayload {
  const payload: ApiItemPayload = {
    servicePlanCategoryItemId: dto.servicePlanCategoryItemId,
    topography: dto.topography,
    status: dto.active,
    dataCollection: toApiDataCollection(dto),
  }

  if (dto.name?.trim()) {
    payload.name = dto.name.trim()
  }

  return payload
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

  return fromApiCategoryResponse(response.data)
}

export async function deleteServicePlanCategoryLevel(
  servicePlanCategoryLevelId: string
): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/service-plan-category-level/${servicePlanCategoryLevelId}`
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete level"))
  }
}

export async function upsertCategoryDataCollection(
  dto: UpsertCategoryDataCollectionDto
): Promise<void> {
  const payload = toApiCategoryPayload(dto)
  const response = await servicePut<ApiCategoryPayload, unknown>(
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

  return fromApiItemResponse(response.data, servicePlanCategoryItemId)
}

export async function deleteServicePlanCategoryItemLevel(
  servicePlanCategoryItemLevelId: string
): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/service-plan-category-item-level/${servicePlanCategoryItemLevelId}`
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete level"))
  }
}

export async function upsertItemDataCollection(
  dto: UpsertItemDataCollectionDto
): Promise<void> {
  const payload = toApiItemPayload(dto)
  const response = await servicePut<ApiItemPayload, unknown>(
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
