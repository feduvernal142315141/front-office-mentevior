import { serviceGet, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  UpsertClientDataCollectionDto,
  ClientDataCollectionQuery,
  ClientDataCollectionRecord,
} from "@/lib/types/client-data-collection.types"

/**
 * GET /client-data-collection
 * Fetch data collection records for an item within a date range.
 */
export async function getClientDataCollectionValues(
  query: ClientDataCollectionQuery,
): Promise<ClientDataCollectionRecord[]> {
  const params = new URLSearchParams({
    clientServicePlanCategoryItemId: query.clientServicePlanCategoryItemId,
    startDate: query.startDate,
    endDate: query.endDate,
  })

  const response = await serviceGet<unknown>(`/client-data-collection?${params.toString()}`)

  if (!response || (response.status !== 200 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch data collection values"))
  }

  if (response.status === 204 || !response.data) return []

  return normalizeRecords(response.data)
}

/**
 * PUT /client-data-collection
 * Upsert a single data collection value for an item + appointment.
 * Returns the record UUID.
 */
export async function upsertClientDataCollectionValue(
  dto: UpsertClientDataCollectionDto,
): Promise<string> {
  const response = await servicePut<UpsertClientDataCollectionDto, unknown>(
    "/client-data-collection",
    dto,
  )

  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to save data collection value"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  if (data && typeof data === "object" && "data" in data) {
    const inner = (data as { data?: unknown }).data
    if (typeof inner === "string") return inner
  }

  return ""
}

// --- Helpers ---

function normalizeRecords(data: unknown): ClientDataCollectionRecord[] {
  const arr = extractArray(data)
  return arr
    .map((item): ClientDataCollectionRecord | null => {
      if (!item || typeof item !== "object") return null
      const rec = item as Record<string, unknown>
      const id = asString(rec.id)
      const date = asString(rec.date)
      if (!id || !date) return null
      return {
        id,
        appointmentId: asString(rec.appointmentId),
        clientServicePlanCategoryItemId: asString(rec.clientServicePlanCategoryItemId),
        value: typeof rec.value === "number" ? rec.value : Number(rec.value) || 0,
        date,
        appointmentStatusId: asString(rec.appointmentStatusId) || undefined,
        appointmentStatusName: asString(rec.appointmentStatusName) || undefined,
        environmentalChange: typeof rec.environmentalChange === "string" ? rec.environmentalChange : null,
      }
    })
    .filter((r): r is ClientDataCollectionRecord => r !== null)
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    const wrapped = data as { entities?: unknown; data?: unknown }
    if (Array.isArray(wrapped.entities)) return wrapped.entities
    if (Array.isArray(wrapped.data)) return wrapped.data
  }
  return []
}

function asString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}
