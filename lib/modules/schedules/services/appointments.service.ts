import { serviceGet, servicePost, servicePut, serviceDelete, servicePatch } from "@/lib/services/baseService"
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
import type { QueryModel } from "@/lib/models/queryModel"
import { getQueryString } from "@/lib/utils/format"
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
 * Fetch appointments via GET /appointment.
 * Requires startDate/endDate (inclusive range). Response is a flat array.
 */
export async function getAppointments(
  opts?: { filters?: string[]; dateFrom?: string; dateTo?: string; providerId?: string } | { dateFrom?: string; dateTo?: string; providerId?: string },
): Promise<Appointment[]> {
  const params = new URLSearchParams()
  if (opts?.providerId) params.set("providerId", opts.providerId)
  if (opts?.dateFrom) params.set("startDate", opts.dateFrom)
  if (opts?.dateTo) params.set("endDate", opts.dateTo)
  if ("filters" in (opts ?? {}) && (opts as { filters?: string[] })?.filters?.length) {
    for (const f of (opts as { filters: string[] }).filters) params.append("filters", f)
  }
  const qs = params.toString()
  const url = `/appointment${qs ? `?${qs}` : ""}`
  const response = await serviceGet<ApiAppointmentItem[] | PaginatedResponse<ApiAppointmentItem>>(url)

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch appointments"))
  }

  return enrichAppointmentsWithClientNames(parseAppointmentList(response.data))
}


/**
 * Fetch appointments for a client via GET /appointment/by-client.
 * Returns all appointments (any status) with the `blocked` field.
 */
export async function getAppointmentsByClient(
  clientId: string,
  startDate: string,
  endDate: string,
): Promise<Appointment[]> {
  const params = new URLSearchParams({ clientId, startDate, endDate })
  const url = `/appointment/by-client?${params.toString()}`
  const response = await serviceGet<ApiAppointmentItem[]>(url)

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch client appointments"))
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

/** Maps AppointmentStatus to the statusName expected by PATCH /appointment/status */
function toStatusName(status: AppointmentStatus): string {
  switch (status) {
    case "InProgress":
      return "In Progress"
    case "NoShow":
      return "No Show"
    default:
      return status
  }
}

/**
 * Update appointment status via PATCH /appointment/status.
 * Respects backend transition rules (e.g. Scheduled → InProgress, InProgress → Completed).
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<string | null> {
  try {
    const response = await servicePatch<{ id: string; statusName: string }, string>(
      "/appointment/status",
      { id, statusName: toStatusName(status) },
    )
    if (response.status === 200) {
      const data = response.data as unknown
      return typeof data === "string" ? data : id
    }
    return null
  } catch {
    return null
  }
}

/**
 * Toggle edit-lock flags (blocked / notCanEdit) via PATCH /appointment/edit-locks.
 * The backend flips both flags to their opposite value on each call.
 */
export async function toggleAppointmentEditLocks(
  appointmentId: string,
): Promise<string | null> {
  try {
    const response = await servicePatch<{ id: string }, string>(
      "/appointment/edit-locks",
      { id: appointmentId },
    )
    if (response.status === 200) {
      const data = response.data as unknown
      return typeof data === "string" ? data : appointmentId
    }
    return null
  } catch {
    return null
  }
}
