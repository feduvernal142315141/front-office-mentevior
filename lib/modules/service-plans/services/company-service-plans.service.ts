import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import {
  resolveCategoryIdFromUnknown,
} from "@/lib/modules/service-plans/constants/service-plan-categories"
import type {
  CompanyServicePlan,
  CreateCompanyServicePlanDto,
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
    return resolveCategoryIdFromUnknown(rawValue)
  }

  if (!entry || typeof entry !== "object") return ""

  const category = entry as Record<string, unknown>
  const explicitId = asString(category.id ?? category.categoryId ?? category.category_id)
  if (explicitId.length > 0) return explicitId

  const rawValue = asString(category.value ?? category.code)
  if (rawValue.length > 0) return rawValue

  const fallbackLabel = asString(category.name ?? category.label)
  return resolveCategoryIdFromUnknown(fallbackLabel)
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
