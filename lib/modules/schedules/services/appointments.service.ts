import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import type { Appointment, AppointmentStatus, UpdateAppointmentDto } from "@/lib/types/appointment.types"
import { MOCK_APPOINTMENTS } from "@/lib/modules/schedules/mocks"

// ============================================
// Types
// ============================================

interface AppointmentFiltersQuery {
  userId?: string
  dateFrom?: string
  dateTo?: string
}

interface CreateAppointmentPayload {
  clientId: string
  eventType?: string
  placeOfServiceAddressId?: string
  startsAt: string
  endsAt: string
  billingCodeIds?: string[]
  addSupervision?: boolean
  supervisionRbtId?: string
  supervisionBillingCodeIds?: string[]
  requiresCaregiverSignature?: boolean
  notes?: string
}

// ============================================
// Service functions
// ============================================

/**
 * Fetch appointments with optional filters.
 * Falls back to mock data when the API is not available.
 */
export async function getAppointments(filters: AppointmentFiltersQuery): Promise<Appointment[]> {
  try {
    const params = new URLSearchParams()
    if (filters.userId) params.set("userId", filters.userId)
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)

    const qs = params.toString()
    const url = `/appointments${qs ? `?${qs}` : ""}`
    const response = await serviceGet<Appointment[]>(url)

    if (response.status === 200 && response.data) {
      return response.data as unknown as Appointment[]
    }

    // Fallback to mocks
    return filterMockAppointments(filters)
  } catch {
    return filterMockAppointments(filters)
  }
}

/**
 * Fetch a single appointment by ID.
 */
export async function getAppointmentById(id: string): Promise<Appointment | null> {
  try {
    const response = await serviceGet<Appointment>(`/appointments/${id}`)

    if (response.status === 200 && response.data) {
      return response.data as unknown as Appointment
    }

    return MOCK_APPOINTMENTS.find((a) => a.id === id) ?? null
  } catch {
    return MOCK_APPOINTMENTS.find((a) => a.id === id) ?? null
  }
}

/**
 * Create a new appointment.
 */
export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment | null> {
  try {
    const response = await servicePost<CreateAppointmentPayload, Appointment>("/appointments", payload)

    if ((response.status === 200 || response.status === 201) && response.data) {
      return response.data as unknown as Appointment
    }

    return null
  } catch {
    return null
  }
}

/**
 * Update an existing appointment.
 */
export async function updateAppointment(
  id: string,
  payload: Partial<UpdateAppointmentDto>,
): Promise<Appointment | null> {
  try {
    const response = await servicePut<{ id: string } & Partial<UpdateAppointmentDto>, Appointment>(
      `/appointments/${id}`,
      { id, ...payload },
    )

    if (response.status === 200 && response.data) {
      return response.data as unknown as Appointment
    }

    return null
  } catch {
    return null
  }
}

/**
 * Delete an appointment.
 */
export async function deleteAppointmentService(id: string): Promise<boolean> {
  try {
    const response = await serviceDelete(`/appointments/${id}`)
    return response.status === 200 || response.status === 204
  } catch {
    return false
  }
}

/**
 * Update appointment status.
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment | null> {
  return updateAppointment(id, { status })
}

// ============================================
// Mock fallback helpers
// ============================================

function filterMockAppointments(filters: AppointmentFiltersQuery): Appointment[] {
  let results = [...MOCK_APPOINTMENTS]

  if (filters.userId) {
    results = results.filter((a) => a.rbtId === filters.userId)
  }

  return results
}
