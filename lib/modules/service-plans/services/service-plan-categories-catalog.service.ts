import { serviceGet, servicePost } from "@/lib/services/baseService"
import {
  createFallbackCategoryIdFromLabel,
  resolveCategoryIdFromUnknown,
} from "@/lib/modules/service-plans/constants/service-plan-categories"

export interface ServicePlanCategoryCatalogOption {
  value: string
  label: string
}

interface CreateServicePlanCategoryPayload {
  name: string
}

interface CreateServicePlanCategoryResult {
  option: ServicePlanCategoryCatalogOption
  usedFallback: boolean
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}

function extractRawCatalogEntries(data: unknown): unknown[] {
  if (Array.isArray(data)) return data

  const wrapped = data as {
    entities?: unknown
    data?: unknown
  }

  if (Array.isArray(wrapped.entities)) return wrapped.entities
  if (Array.isArray(wrapped.data)) return wrapped.data

  const wrappedData = wrapped.data as { entities?: unknown } | undefined
  if (wrappedData && Array.isArray(wrappedData.entities)) return wrappedData.entities

  return []
}

function normalizeCategoryEntry(entry: unknown): ServicePlanCategoryCatalogOption | null {
  if (typeof entry === "string") {
    const normalizedLabel = entry.trim()
    if (normalizedLabel.length === 0) return null

    const fallbackId = resolveCategoryIdFromUnknown(normalizedLabel)
    return {
      value: fallbackId.length > 0 ? fallbackId : normalizedLabel,
      label: normalizedLabel,
    }
  }

  if (!entry || typeof entry !== "object") return null

  const raw = entry as Record<string, unknown>
  const label = asString(raw.name ?? raw.label)
  const explicitId = asString(raw.id ?? raw.categoryId ?? raw.category_id)
  const fallbackValue = asString(raw.code ?? raw.value)
  const fallbackIdFromLabel = label.length > 0 ? resolveCategoryIdFromUnknown(label) : ""
  const value = explicitId || fallbackValue || fallbackIdFromLabel || label

  if (value.length === 0) return null

  return {
    value,
    label: label.length > 0 ? label : value,
  }
}

function normalizeResponseCategory(data: unknown): ServicePlanCategoryCatalogOption | null {
  if (!data || typeof data !== "object") return null

  const wrapped = data as {
    entities?: unknown
    data?: unknown
    entity?: unknown
  }

  const direct = normalizeCategoryEntry(data)
  if (direct) return direct

  if (wrapped.entity) {
    const normalized = normalizeCategoryEntry(wrapped.entity)
    if (normalized) return normalized
  }

  if (wrapped.data) {
    const normalizedFromData = normalizeCategoryEntry(wrapped.data)
    if (normalizedFromData) return normalizedFromData

    if (typeof wrapped.data === "object" && wrapped.data !== null) {
      const dataObject = wrapped.data as { entity?: unknown; entities?: unknown }
      if (dataObject.entity) {
        const normalizedEntity = normalizeCategoryEntry(dataObject.entity)
        if (normalizedEntity) return normalizedEntity
      }

      if (Array.isArray(dataObject.entities) && dataObject.entities.length > 0) {
        const normalizedEntity = normalizeCategoryEntry(dataObject.entities[0])
        if (normalizedEntity) return normalizedEntity
      }
    }
  }

  if (Array.isArray(wrapped.entities) && wrapped.entities.length > 0) {
    const normalized = normalizeCategoryEntry(wrapped.entities[0])
    if (normalized) return normalized
  }

  return null
}

function getResponseErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null

  const maybeMessage = (data as { message?: unknown }).message
  return typeof maybeMessage === "string" && maybeMessage.trim().length > 0
    ? maybeMessage
    : null
}

export async function getServicePlanCategoriesCatalog(): Promise<ServicePlanCategoryCatalogOption[]> {
  const response = await serviceGet<unknown>("/category/catalog")

  if (response.status !== 200 || !response.data) {
    throw new Error(getResponseErrorMessage(response.data) || "Failed to fetch service plan categories catalog")
  }

  const entries = extractRawCatalogEntries(response.data)
  const normalized = entries
    .map((entry) => normalizeCategoryEntry(entry))
    .filter((option): option is ServicePlanCategoryCatalogOption => option !== null)

  const seen = new Set<string>()
  return normalized.filter((option) => {
    const normalizedLabel = option.label.trim().toLowerCase()
    const dedupeKey = normalizedLabel.length > 0 ? `label:${normalizedLabel}` : `value:${option.value.trim().toLowerCase()}`
    if (seen.has(dedupeKey)) return false
    seen.add(dedupeKey)
    return true
  })
}

export async function createServicePlanCategory(
  name: string
): Promise<CreateServicePlanCategoryResult> {
  const normalizedName = name.trim()

  if (normalizedName.length === 0) {
    throw new Error("Category name is required")
  }

  const response = await servicePost<CreateServicePlanCategoryPayload, unknown>("/category", {
    name: normalizedName,
  })

  if (response.status === 200 || response.status === 201) {
    const normalizedResponse = normalizeResponseCategory(response.data)

    if (normalizedResponse) {
      return {
        option: normalizedResponse,
        usedFallback: false,
      }
    }

    return {
      option: {
        value: createFallbackCategoryIdFromLabel(normalizedName),
        label: normalizedName,
      },
      usedFallback: true,
    }
  }

  throw new Error(getResponseErrorMessage(response.data) || "Failed to create category")
}
