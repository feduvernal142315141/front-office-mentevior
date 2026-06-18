import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  ApiAppointmentItem,
  Appointment,
  AppointmentApiPayload,
  AppointmentListQuery,
  AppointmentStatus,
} from "@/lib/types/appointment.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { fromApiAppointment } from "@/lib/modules/schedules/utils/appointment-api.mapper"

function parseAppointmentList(data: unknown): Appointment[] {
  if (Array.isArray(data)) {
    return data.map((item) => fromApiAppointment(item as ApiAppointmentItem))
  }

  if (data && typeof data === "object") {
    const paginated = data as PaginatedResponse<ApiAppointmentItem>
    if (Array.isArray(paginated.entities)) {
      return paginated.entities.map(fromApiAppointment)
    }

    const wrapped = data as { data?: unknown; entities?: unknown }
    if (Array.isArray(wrapped.entities)) {
      return (wrapped.entities as ApiAppointmentItem[]).map(fromApiAppointment)
    }
    if (Array.isArray(wrapped.data)) {
      return (wrapped.data as ApiAppointmentItem[]).map(fromApiAppointment)
    }
  }

  return []
}

/**
 * Fetch appointments for a provider within a date range via GET /appointment.
 */
export async function getAppointments(filters: AppointmentListQuery): Promise<Appointment[]> {
  const params = new URLSearchParams()
  if (filters.providerId) params.set("providerId", filters.providerId)
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
  if (filters.dateTo) params.set("dateTo", filters.dateTo)

  const qs = params.toString()
  const url = `/appointment${qs ? `?${qs}` : ""}`
  const response = await serviceGet<ApiAppointmentItem[] | PaginatedResponse<ApiAppointmentItem>>(url)

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch appointments"))
  }

  return parseAppointmentList(response.data)
}

/**
 * Fetch a single appointment by ID via GET /appointment/{id}.
 */
export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const response = await serviceGet<ApiAppointmentItem>(`/appointment/${id}`)

  if (response.status !== 200 || !response.data) {
    return null
  }

  return fromApiAppointment(response.data as unknown as ApiAppointmentItem)
}

/**
 * Create a new appointment via POST /appointment.
 * Response is the created appointment UUID string.
 */
export async function createAppointment(payload: AppointmentApiPayload): Promise<string> {
  const response = await servicePost<AppointmentApiPayload, string>("/appointment", payload)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to create appointment"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  if (data && typeof data === "object" && "data" in (data as object)) {
    const inner = (data as { data?: unknown }).data
    if (typeof inner === "string") return inner
  }

  throw new Error("Invalid response from appointment create")
}

/**
 * Update an existing appointment via PUT /appointment.
 */
export async function updateAppointmentApi(
  payload: AppointmentApiPayload & { id: string },
): Promise<string> {
  const response = await servicePut<AppointmentApiPayload & { id: string }, string>(
    "/appointment",
    payload,
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to update appointment"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  if (data && typeof data === "object" && "data" in (data as object)) {
    const inner = (data as { data?: unknown }).data
    if (typeof inner === "string") return inner
  }

  return payload.id
}

/**
 * Delete an appointment via DELETE /appointment/{id}.
 */
export async function deleteAppointmentService(id: string): Promise<boolean> {
  const response = await serviceDelete(`/appointment/${id}`)
  return response.status === 200 || response.status === 204
}

/**
 * Update appointment status (calendar UI — endpoint TBD).
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment | null> {
  try {
    const response = await servicePut<{ id: string; status: AppointmentStatus }, Appointment>(
      `/appointment/${id}`,
      { id, status },
    )
    if (response.status === 200 && response.data) {
      return fromApiAppointment(response.data as unknown as ApiAppointmentItem)
    }
    return null
  } catch {
    return null
  }
}
