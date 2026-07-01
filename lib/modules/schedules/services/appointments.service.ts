import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import { getClientAddressById } from "@/lib/modules/client-addresses/services/client-addresses.service"
import { getClientById } from "@/lib/modules/clients/services/clients.service"
import type {
  ApiAppointmentItem,
  Appointment,
  AppointmentApiPayload,
  AppointmentListQuery,
  AppointmentStatus,
} from "@/lib/types/appointment.types"
import type { Client } from "@/lib/types/client.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { fromApiAppointment } from "@/lib/modules/schedules/utils/appointment-api.mapper"

function formatClientName(client: Client): string {
  const full = [client.firstName, client.lastName].filter(Boolean).join(" ").trim()
  return full || (client as Client & { fullName?: string }).fullName || ""
}

async function enrichAppointmentsWithClientNames(
  appointments: Appointment[],
): Promise<Appointment[]> {
  const toResolve = appointments.filter(
    (apt) => !apt.clientName?.trim() && apt.placeOfServiceAddressId,
  )
  if (toResolve.length === 0) return appointments

  const uniqueAddressIds = [
    ...new Set(toResolve.map((apt) => apt.placeOfServiceAddressId!)),
  ]

  const addressToClientId = new Map<string, string>()
  await Promise.all(
    uniqueAddressIds.map(async (addressId) => {
      try {
        const address = await getClientAddressById(addressId)
        if (address?.clientId) addressToClientId.set(addressId, address.clientId)
      } catch {
        // skip failed address lookups
      }
    }),
  )

  const uniqueClientIds = [...new Set(addressToClientId.values())]
  const clientNameById = new Map<string, string>()
  await Promise.all(
    uniqueClientIds.map(async (clientId) => {
      try {
        const client = await getClientById(clientId)
        if (client) {
          const name = formatClientName(client)
          if (name) clientNameById.set(clientId, name)
        }
      } catch {
        // skip failed client lookups
      }
    }),
  )

  return appointments.map((apt) => {
    if (apt.clientName?.trim()) return apt
    const clientId = addressToClientId.get(apt.placeOfServiceAddressId ?? "")
    const clientName = clientId ? clientNameById.get(clientId) : undefined
    if (!clientName) return apt
    return {
      ...apt,
      clientId: apt.clientId || clientId || "",
      clientName,
    }
  })
}

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
  if (filters.clientId) params.set("clientId", filters.clientId)
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
  if (filters.dateTo) params.set("dateTo", filters.dateTo)

  const qs = params.toString()
  const url = `/appointment${qs ? `?${qs}` : ""}`
  const response = await serviceGet<ApiAppointmentItem[] | PaginatedResponse<ApiAppointmentItem>>(url)

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch appointments"))
  }

  return enrichAppointmentsWithClientNames(parseAppointmentList(response.data))
}

/**
 * Fetch a single appointment by ID via GET /appointment/{id}.
 */
export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const response = await serviceGet<ApiAppointmentItem>(`/appointment/${id}`)

  if (response.status !== 200 || !response.data) {
    return null
  }

  const raw = response.data as unknown
  let item: ApiAppointmentItem | null = null

  if (raw && typeof raw === "object" && "entities" in (raw as object)) {
    const entities = (raw as { entities?: unknown }).entities
    if (Array.isArray(entities) && entities.length > 0) {
      item = entities[0] as ApiAppointmentItem
    }
  } else if (raw && typeof raw === "object" && "data" in (raw as object)) {
    const data = (raw as { data?: unknown }).data
    if (data && typeof data === "object") {
      item = data as ApiAppointmentItem
    }
  } else if (raw && typeof raw === "object" && "id" in (raw as object)) {
    item = raw as ApiAppointmentItem
  }

  if (!item) return null

  const [enriched] = await enrichAppointmentsWithClientNames([fromApiAppointment(item)])
  return enriched
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
