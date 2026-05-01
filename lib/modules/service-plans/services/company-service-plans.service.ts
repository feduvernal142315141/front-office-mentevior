import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  AssignItemsToServicePlanCategoryPayload,
  CompanyServicePlan,
  CreateCompanyServicePlanDto,
  ItemCatalogItem,
  ServicePlanCategoryMappedItem,
  ServicePlanCategorySummary,
  UpdateCompanyServicePlanDto,
} from "@/lib/types/company-service-plan.types"

function asString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function normalizeCategoryIdEntry(entry: unknown): string {
  if (typeof entry === "string") {
    const rawValue = entry.trim()
    if (rawValue.length === 0) return ""
    // Keep backend value as-is to avoid turning category names into fallback ids.
    return rawValue
  }

  if (!entry || typeof entry !== "object") return ""

  const category = entry as Record<string, unknown>
  const explicitId = asString(category.id ?? category.categoryId ?? category.category_id)
  if (explicitId.length > 0) return explicitId

  const rawValue = asString(category.value ?? category.code)
  if (rawValue.length > 0) return rawValue

  const fallbackLabel = asString(category.name ?? category.label)
  return fallbackLabel.trim()
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

function normalizeServicePlan(raw: unknown): CompanyServicePlan {
  const item = raw as Record<string, unknown>

  return {
    id: asString(item.id),
    serviceId: asString(item.serviceId ?? item.service_id),
    serviceName: asString(item.serviceName ?? item.service_name),
    name: asString(item.name),
    description: asString(item.description),
    startDate: asString(item.startDate ?? item.start_date),
    endDate: asString(item.endDate ?? item.end_date),
    active: Boolean(item.active),
    categories: normalizeCategoryIds(item.categories ?? item.categoryIds ?? item.category_ids),
  }
}

function normalizeServicePlanCategorySummary(raw: unknown): ServicePlanCategorySummary {
  const item = raw as Record<string, unknown>
  const totalItemsRaw = item.totalItems ?? item.total_items

  return {
    id: asString(item.id),
    categoryId: asString(item.categoryId ?? item.category_id),
    categoryName: asString(item.categoryName ?? item.category_name),
    totalItems:
      typeof totalItemsRaw === "number"
        ? totalItemsRaw
        : typeof totalItemsRaw === "string"
          ? Number(totalItemsRaw) || 0
          : 0,
  }
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
    const normalizedValue = value.trim().toLowerCase()
    if (normalizedValue === "true" || normalizedValue === "1") return true
    if (normalizedValue === "false" || normalizedValue === "0") return false
  }

  return undefined
}

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value

  if (typeof value === "string") {
    const normalizedValue = value.trim()
    if (normalizedValue.length === 0) return undefined

    const parsed = Number(normalizedValue)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function normalizeServicePlanCategoryMappedItem(raw: unknown): ServicePlanCategoryMappedItem {
  const item = raw as Record<string, unknown>
  const nestedItem = (item.item && typeof item.item === "object" ? item.item : {}) as Record<string, unknown>

  const id = asString(item.id ?? item.servicePlanCategoryItemId ?? item.service_plan_category_item_id)
  const itemId = asString(
    item.itemId ??
      item.item_id ??
      item.idItem ??
      nestedItem.id ??
      nestedItem.itemId ??
      // Some backends return mapped entries already flattened as item rows.
      item.id
  )
  const itemName = asString(item.itemName ?? item.item_name ?? item.name ?? nestedItem.name ?? nestedItem.itemName)

  return {
    id: id.length > 0 ? id : itemId,
    itemId,
    itemName,
    description: asOptionalString(item.description ?? item.itemDescription ?? item.item_description),
    active: asOptionalBoolean(item.active),
    order: asOptionalNumber(item.order ?? item.sortOrder ?? item.sort_order ?? item.position),
  }
}

function normalizeItemCatalogEntry(raw: unknown): ItemCatalogItem {
  const item = raw as Record<string, unknown>

  return {
    id: asString(item.id),
    categoryId: asString(item.categoryId ?? item.category_id),
    name: asString(item.name ?? item.itemName ?? item.item_name),
  }
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

function extractSingleServicePlan(data: unknown): CompanyServicePlan | null {
  if (!data || typeof data !== "object") return null

  const wrapped = data as {
    entity?: unknown
    data?: unknown
    entities?: unknown
  }

  const directId = asString((data as Record<string, unknown>).id)
  if (directId.length > 0) return normalizeServicePlan(data)

  if (wrapped.entity && typeof wrapped.entity === "object") {
    return normalizeServicePlan(wrapped.entity)
  }

  if (wrapped.data && typeof wrapped.data === "object") {
    const nestedData = wrapped.data as Record<string, unknown>
    const nestedId = asString(nestedData.id)
    if (nestedId.length > 0) return normalizeServicePlan(wrapped.data)

    const nestedEntity = nestedData.entity
    if (nestedEntity && typeof nestedEntity === "object") {
      return normalizeServicePlan(nestedEntity)
    }
  }

  if (Array.isArray(wrapped.entities) && wrapped.entities.length > 0) {
    return normalizeServicePlan(wrapped.entities[0])
  }

  return null
}

export async function getCompanyServicePlans(): Promise<{
  servicePlans: CompanyServicePlan[]
  totalCount: number
}> {
  const response = await serviceGet<CompanyServicePlan[] | { entities?: CompanyServicePlan[] }>(
    "/service-plan"
  )

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch service plans")
  }

  const rawPlans = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data.entities)
      ? response.data.entities
      : []

  const servicePlans = rawPlans.map((rawPlan) => normalizeServicePlan(rawPlan))
  return {
    servicePlans,
    totalCount: servicePlans.length,
  }
}

export async function getCompanyServicePlanById(id: string): Promise<CompanyServicePlan | null> {
  const response = await serviceGet<unknown>(`/service-plan/${id}`)

  if (response.status === 404) return null

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch service plan")
  }

  const servicePlan = extractSingleServicePlan(response.data)
  if (!servicePlan) {
    throw new Error("Invalid service plan response")
  }

  return servicePlan
}

export async function getServicePlanCategoriesByServicePlanId(
  servicePlanId: string
): Promise<ServicePlanCategorySummary[]> {
  const response = await serviceGet<unknown>(`/service-plan/${servicePlanId}/category`)

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch service plan categories")
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
    .map((entry) => normalizeServicePlanCategorySummary(entry))
    .filter((entry) => entry.categoryId.length > 0)
}

export async function getServicePlanCategoryItemsByServicePlanCategoryId(
  servicePlanCategoryId: string
): Promise<ServicePlanCategoryMappedItem[]> {
  const response = await serviceGet<unknown>(`/service-plan-category-item/${servicePlanCategoryId}/item`)

  if (response.status !== 200 || !response.data) {
    throw new Error(`Failed to fetch mapped items for service plan category ${servicePlanCategoryId}`)
  }

  const rawData = response.data as unknown
  const entries = extractCollectionEntries(rawData)

  return entries
    .map((entry) => normalizeServicePlanCategoryMappedItem(entry))
    .filter((entry) => entry.itemId.length > 0)
}

export async function getItemCatalog(): Promise<ItemCatalogItem[]> {
  const response = await serviceGet<unknown>("/item/catalog")

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch item catalog")
  }

  const entries = extractCollectionEntries(response.data)

  return entries
    .map((entry) => normalizeItemCatalogEntry(entry))
    .filter((entry) => entry.id.length > 0 && entry.name.length > 0)
}

export async function assignItemsToServicePlanCategory(
  servicePlanCategoryId: string,
  itemIds: string[]
): Promise<void> {
  const payload: AssignItemsToServicePlanCategoryPayload = { itemIds }
  const response = await servicePost<AssignItemsToServicePlanCategoryPayload, unknown>(
    `/service-plan-category-item/${servicePlanCategoryId}/item`,
    payload
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error("Failed to assign items to service plan category")
  }
}

export async function createCompanyServicePlan(
  payload: CreateCompanyServicePlanDto
): Promise<CompanyServicePlan> {
  const requestPayload: CreateCompanyServicePlanDto = {
    serviceId: payload.serviceId,
    name: payload.name,
    startDate: payload.startDate,
    endDate: payload.endDate,
    description: payload.description,
    active: payload.active,
    categories: payload.categories,
  }

  const response = await servicePost<CreateCompanyServicePlanDto, CompanyServicePlan>(
    "/service-plan",
    requestPayload
  )

  if ((response.status === 200 || response.status === 201) && response.data) {
    return normalizeServicePlan(response.data)
  }

  throw new Error("Failed to create service plan")
}

export async function updateCompanyServicePlan(
  payload: UpdateCompanyServicePlanDto
): Promise<CompanyServicePlan | null> {
  const requestPayload: UpdateCompanyServicePlanDto = {
    id: payload.id,
    serviceId: payload.serviceId,
    name: payload.name,
    startDate: payload.startDate,
    endDate: payload.endDate,
    description: payload.description,
    active: payload.active,
    categories: payload.categories,
  }

  const response = await servicePut<UpdateCompanyServicePlanDto, CompanyServicePlan>(
    "/service-plan",
    requestPayload
  )

  if ((response.status === 200 || response.status === 201) && response.data) {
    return normalizeServicePlan(response.data)
  }

  if (response.status === 404) {
    return null
  }

  throw new Error("Failed to update service plan")
}

export async function deleteCompanyServicePlan(id: string): Promise<boolean> {
  const response = await serviceDelete(`/service-plan/${id}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error((response.data as { message?: string } | undefined)?.message || "Failed to delete service plan")
  }

  return true
}
