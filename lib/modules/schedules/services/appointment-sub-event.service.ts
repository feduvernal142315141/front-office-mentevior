import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"

// ============================================
// Types
// ============================================

export interface SubEventPayload {
  appointmentId: string
  timeInit: string
  timeEnd: string
  date: string
  billingCodeId: string
  supervisionBillingCodeId?: string
  units: number
  providerId: string
}

export interface SubEventResponse {
  id: string
  appointmentId: string
  timeInit: string
  timeEnd: string
  date: string
  startAt: string
  endAt: string
  billingCodeId: string
  supervisionBillingCodeId?: string
  units: number
  providerId: string
  providerName?: string
  active: boolean
  appointmentStatusId?: string
  appointmentStatusName?: string
}

// ============================================
// API calls
// ============================================

/** POST /appointment-sub-event — create a supervision sub-event */
export async function createSubEvent(payload: SubEventPayload): Promise<string> {
  const response = await servicePost<SubEventPayload, string>(
    "/appointment-sub-event",
    payload,
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to create supervision"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  if (data && typeof data === "object" && "data" in (data as object)) {
    const inner = (data as { data?: unknown }).data
    if (typeof inner === "string") return inner
  }

  throw new Error("Invalid response from sub-event create")
}

/** PUT /appointment-sub-event — update an existing supervision sub-event */
export async function updateSubEvent(
  payload: SubEventPayload & { id?: string },
): Promise<string> {
  const response = await servicePut<SubEventPayload & { id?: string }, string>(
    "/appointment-sub-event",
    payload,
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to update supervision"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  if (data && typeof data === "object" && "data" in (data as object)) {
    const inner = (data as { data?: unknown }).data
    if (typeof inner === "string") return inner
  }

  return payload.appointmentId
}

/** DELETE /appointment-sub-event/{id} — soft delete a supervision sub-event */
export async function deleteSubEvent(id: string): Promise<boolean> {
  const response = await serviceDelete(`/appointment-sub-event/${id}`)
  return response.status === 200 || response.status === 201
}

/** GET /appointment-sub-event/{id} — fetch a single supervision sub-event */
export async function getSubEvent(id: string): Promise<SubEventResponse | null> {
  const response = await serviceGet<SubEventResponse>(`/appointment-sub-event/${id}`)

  if (response.status !== 200 || !response.data) return null

  const raw = response.data as unknown
  if (raw && typeof raw === "object" && "id" in (raw as object)) {
    return raw as SubEventResponse
  }

  return null
}
