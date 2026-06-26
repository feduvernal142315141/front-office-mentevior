import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  AssignItemsToClientServicePlanCategoryDto,
  ClientItemCatalogItem,
  ClientServicePlan,
  ClientServicePlanCategoryMappedItem,
  ClientServicePlanCategorySummary,
  UpdateClientServicePlanDto,
} from "@/lib/types/client-service-plan.types"

// --- Helpers de normalización ---

function asString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function asOptionalString(value: unknown): string | undefined {
  const parsed = asString(value).trim()
  return parsed.length > 0 ? parsed : undefined
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value === "number") {
    if (value === 1) return true
    if (value === 0) return false
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (v === "true" || v === "1") return true
    if (v === "false" || v === "0") return false
  }
  return undefined
}

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const v = value.trim()
    if (v.length === 0) return undefined
    const parsed = Number(v)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function extractCollectionEntries(rawData: unknown): unknown[] {
  const wrapped = (rawData && typeof rawData === "object" ? rawData : {}) as {
    entities?: unknown
    data?: unknown
  }
  if (Array.isArray(rawData)) return rawData
  if (Array.isArray(wrapped.entities)) return wrapped.entities
  if (Array.isArray(wrapped.data)) return wrapped.data
  return []
}

function normalizeCategoryIdEntry(entry: unknown): string {
  if (typeof entry === "string") {
    const v = entry.trim()
    return v.length > 0 ? v : ""
  }
  if (!entry || typeof entry !== "object") return ""
  const cat = entry as Record<string, unknown>
  const explicitId = asString(cat.id ?? cat.categoryId ?? cat.category_id)
  if (explicitId.length > 0) return explicitId
  const rawValue = asString(cat.value ?? cat.code)
  if (rawValue.length > 0) return rawValue
  return asString(cat.name ?? cat.label).trim()
}

function normalizeCategoryIds(value: unknown): string[] {
  const rawEntries = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { entities?: unknown }).entities)
      ? (value as { entities: unknown[] }).entities
      : value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)
        ? (value as { data: unknown[] }).data
        : []

  return rawEntries
    .map((entry) => normalizeCategoryIdEntry(entry))
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index)
}

function normalizeClientServicePlan(raw: unknown): ClientServicePlan {
  const item = raw as Record<string, unknown>
  return {
    id: asString(item.id),
    clientId: asString(item.clientId ?? item.client_id),
    servicePlanId: asString(item.servicePlanId ?? item.service_plan_id),
    name: asString(item.name),
    description: asString(item.description),
    startDate: asOptionalString(item.startDate ?? item.start_date),
    endDate: asOptionalString(item.endDate ?? item.end_date),
    active: Boolean(item.active),
    categories: normalizeCategoryIds(item.categories ?? item.categoryIds ?? item.category_ids),
  }
}

function normalizeClientCategorySummary(raw: unknown): ClientServicePlanCategorySummary {
  const item = raw as Record<string, unknown>
  const totalItemsRaw = item.totalItems ?? item.total_items
  return {
    id: asString(item.id),
    categoryId: asString(item.categoryId ?? item.category_id),
    categoryName: asString(item.categoryName ?? item.category_name),
    canEdit: asOptionalBoolean(item.canEdit ?? item.can_edit),
    totalItems:
      typeof totalItemsRaw === "number"
        ? totalItemsRaw
        : typeof totalItemsRaw === "string"
          ? Number(totalItemsRaw) || 0
          : 0,
    hasDataCollection: asOptionalBoolean(item.hasDataCollection ?? item.has_data_collection),
  }
}

function normalizeClientCategoryMappedItem(raw: unknown): ClientServicePlanCategoryMappedItem {
  const item = raw as Record<string, unknown>
  const nestedItem = (item.item && typeof item.item === "object" ? item.item : {}) as Record<string, unknown>

  const id = asString(
    item.id ??
      item.clientServicePlanCategoryItemId ??
      item.client_service_plan_category_item_id
  )
  const itemId = asString(
    item.itemId ??
      item.item_id ??
      item.idItem ??
      nestedItem.id ??
      nestedItem.itemId ??
      item.id
  )
  const itemName = asString(
    item.itemName ?? item.item_name ?? item.name ?? nestedItem.name ?? nestedItem.itemName
  )

  return {
    id: id.length > 0 ? id : itemId,
    itemId,
    itemName,
    canEdit: asOptionalBoolean(item.canEdit ?? item.can_edit ?? nestedItem.canEdit ?? nestedItem.can_edit),
    description: asOptionalString(item.description ?? item.itemDescription ?? item.item_description ?? item.topography),
    active: asOptionalBoolean(item.active ?? item.status),
    order: asOptionalNumber(item.order ?? item.sortOrder ?? item.sort_order ?? item.position),
    hasDataCollection: asOptionalBoolean(item.hasDataCollection ?? item.has_data_collection),
    hasCustomDataCollection: asOptionalBoolean(item.hasCustomDataCollection ?? item.has_custom_data_collection),
    teachingMethodId: asOptionalString(item.teachingMethodId ?? item.teaching_method_id) ?? null,
    baseline: Array.isArray(item.baseline) ? item.baseline as ClientServicePlanCategoryMappedItem["baseline"] : undefined,
    objetive: Array.isArray(item.objetive) ? item.objetive as ClientServicePlanCategoryMappedItem["objetive"] : undefined,
    dataCollection: (item.dataCollection && typeof item.dataCollection === "object") ? item.dataCollection as ClientServicePlanCategoryMappedItem["dataCollection"] : undefined,
    chart: (item.chart && typeof item.chart === "object") ? item.chart as ClientServicePlanCategoryMappedItem["chart"] : undefined,
  }
}

function normalizeClientItemCatalogEntry(raw: unknown): ClientItemCatalogItem {
  const item = raw as Record<string, unknown>
  return {
    id: asString(item.id ?? item.itemId ?? item.item_id ?? item.idItem),
    categoryId: asString(item.categoryId ?? item.category_id),
    name: asString(item.name ?? item.itemName ?? item.item_name),
    canEdit: asOptionalBoolean(item.canEdit ?? item.can_edit),
  }
}

function normalizeClientItemCatalogCollection(rawData: unknown): ClientItemCatalogItem[] {
  const entries = extractCollectionEntries(rawData)
  return entries
    .map((entry) => normalizeClientItemCatalogEntry(entry))
    .filter((entry) => entry.id.length > 0 && entry.name.length > 0)
}

function extractSingleClientServicePlan(data: unknown): ClientServicePlan | null {
  if (!data || typeof data !== "object") return null

  const wrapped = data as {
    entity?: unknown
    data?: unknown
    entities?: unknown
  }

  const directId = asString((data as Record<string, unknown>).id)
  if (directId.length > 0) return normalizeClientServicePlan(data)

  if (wrapped.entity && typeof wrapped.entity === "object") {
    return normalizeClientServicePlan(wrapped.entity)
  }

  if (wrapped.data && typeof wrapped.data === "object") {
    const nestedData = wrapped.data as Record<string, unknown>
    const nestedId = asString(nestedData.id)
    if (nestedId.length > 0) return normalizeClientServicePlan(wrapped.data)

    const nestedEntity = nestedData.entity
    if (nestedEntity && typeof nestedEntity === "object") {
      return normalizeClientServicePlan(nestedEntity)
    }
  }

  if (Array.isArray(wrapped.entities) && wrapped.entities.length > 0) {
    return normalizeClientServicePlan(wrapped.entities[0])
  }

  return null
}

// --- Client Service Plan CRUD ---

export async function getClientServicePlanByClientId(clientId: string): Promise<ClientServicePlan | null> {
  const filters = encodeURIComponent(JSON.stringify([{ field: "clientId", value: clientId }]))
  const response = await serviceGet<unknown>(
    `/client-service-plan?filters=${filters}&page=0&pageSize=1`
  )

  if (response.status === 404) return null

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch client service plan")
  }

  const entries = extractCollectionEntries(response.data)
  if (entries.length === 0) return null

  return normalizeClientServicePlan(entries[0])
}

export async function getClientServicePlanById(id: string): Promise<ClientServicePlan | null> {
  const response = await serviceGet<unknown>(`/client-service-plan/${id}`)

  if (response.status === 404) return null

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch client service plan")
  }

  const plan = extractSingleClientServicePlan(response.data)
  if (!plan) {
    throw new Error("Invalid client service plan response")
  }

  return plan
}

export async function updateClientServicePlan(dto: UpdateClientServicePlanDto): Promise<void> {
  const response = await servicePut<UpdateClientServicePlanDto, unknown>("/client-service-plan", dto)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to update client service plan"
    )
  }
}

// --- Categories ---

export async function getClientServicePlanCategories(
  clientServicePlanId: string
): Promise<ClientServicePlanCategorySummary[]> {
  const response = await serviceGet<unknown>(`/client-service-plan/${clientServicePlanId}/category`)

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch client service plan categories")
  }

  const rawData = response.data as unknown
  const wrapped = (rawData && typeof rawData === "object" ? rawData : {}) as {
    entities?: unknown
    data?: unknown
  }
  const entries = Array.isArray(rawData)
    ? rawData
    : Array.isArray(wrapped.entities)
      ? wrapped.entities
      : Array.isArray(wrapped.data)
        ? wrapped.data
        : []

  return entries
    .map((entry) => normalizeClientCategorySummary(entry))
    .filter((entry) => entry.categoryId.length > 0)
}

// --- Category Items ---

export async function getClientServicePlanCategoryItems(
  clientServicePlanCategoryId: string
): Promise<ClientServicePlanCategoryMappedItem[]> {
  const response = await serviceGet<unknown>(
    `/client-service-plan-category-item/item-by-client-service-plan-category-id/${clientServicePlanCategoryId}`
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(`Failed to fetch items for client service plan category ${clientServicePlanCategoryId}`)
  }

  const entries = extractCollectionEntries(response.data)
  return entries
    .map((entry) => normalizeClientCategoryMappedItem(entry))
    .filter((entry) => entry.itemId.length > 0)
}

export async function assignItemsToClientServicePlanCategory(
  dto: AssignItemsToClientServicePlanCategoryDto
): Promise<void> {
  const response = await servicePost<AssignItemsToClientServicePlanCategoryDto, unknown>(
    "/client-service-plan-category-item",
    dto
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error("Failed to assign items to client service plan category")
  }
}

export async function deleteClientServicePlanCategoryItem(id: string): Promise<void> {
  const response = await serviceDelete<never, unknown>(`/client-service-plan-category-item/${id}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ??
        "Failed to delete client service plan category item"
    )
  }
}

// --- Clone ---

export interface CloneServicePlanToClientDto {
  clientId: string
  servicePlanId: string
}

export async function cloneServicePlanToClient(dto: CloneServicePlanToClientDto): Promise<string> {
  const response = await servicePost<CloneServicePlanToClientDto, unknown>(
    "/client-service-plan/clone-to-client",
    dto
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ??
        "Failed to clone service plan to client"
    )
  }

  const responseData = response.data as unknown

  // The API returns the new client service plan ID as a raw string
  if (typeof responseData === "string" && responseData.trim().length > 0) {
    return responseData.trim().replace(/^"|"$/g, "")
  }

  // Fallback: extract id from object response
  const raw = responseData as Record<string, unknown> | null
  const id = asString(raw?.id ?? raw?.clientServicePlanId ?? "")
  if (id) return id

  throw new Error("Clone succeeded but no usable client service plan ID was returned")
}

// --- Create Item ---

export interface CreateClientItemDto {
  servicePlanCategoryId: string
  name: string
  type: "SERVICE_PLAN" | "CLIENT_SERVICE_PLAN"
}

export async function createClientServicePlanItem(
  payload: CreateClientItemDto
): Promise<string> {
  const response = await servicePost<CreateClientItemDto, unknown>("/item", payload)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ?? "Failed to create item"
    )
  }

  const responseData = response.data as unknown

  if (responseData && typeof responseData === "object") {
    const wrapped = responseData as { entity?: unknown; data?: unknown; id?: unknown }
    const target = wrapped.entity ?? wrapped.data ?? responseData
    const raw = target as Record<string, unknown>
    const id = asString(raw?.id ?? raw?.itemId ?? raw?.item_id ?? "")
    if (id.length > 0) return id
  }

  return ""
}

// --- Item Catalog ---

export async function getClientServicePlanItemCatalog(
  clientServicePlanId: string,
  page: number,
  pageSize: number
): Promise<{ items: ClientItemCatalogItem[]; hasMore: boolean }> {
  const response = await serviceGet<unknown>(
    `/client-service-plan/${clientServicePlanId}/item/catalog?page=${page}&pageSize=${pageSize}`
  )

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch client service plan item catalog")
  }

  const items = normalizeClientItemCatalogCollection(response.data)
  return { items, hasMore: items.length === pageSize }
}
