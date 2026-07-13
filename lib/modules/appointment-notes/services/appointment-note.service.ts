import { serviceGet, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  AppointmentNote,
  UpdateAppointmentNotePayload,
} from "@/lib/types/appointment-note.types"

/**
 * Fetch the appointment note by appointment ID.
 * GET /appointment/{appointmentId}/note
 */
export async function getAppointmentNote(
  appointmentId: string,
): Promise<AppointmentNote | null> {
  const response = await serviceGet<unknown>(`/appointment/${appointmentId}/note`)

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch appointment note"))
  }

  if (!response.data) return null

  const raw = response.data as Record<string, unknown>

  // Handle wrapped responses
  const data = (raw.entity ?? raw.data ?? raw) as Record<string, unknown>
  if (!data || !data.id) return null

  return {
    id: String(data.id ?? ""),
    appointmentId: String(data.appointmentId ?? appointmentId),
    teachingMethodList: Array.isArray(data.teachingMethodList)
      ? data.teachingMethodList.map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
        }))
      : [],
    reasonCaregiverNotPresent: String(data.reasonCaregiverNotPresent ?? ""),
    medicalConcerns: String(data.medicalConcerns ?? ""),
    crisisInvolved: Boolean(data.crisisInvolved),
    sessionSummary: String(data.sessionSummary ?? ""),
    participants: Array.isArray(data.participants)
      ? data.participants.map((p: Record<string, unknown>) => ({
          id: String(p.id ?? ""),
          catalogId: String(p.catalogId ?? ""),
          catalogType: String(p.catalogType ?? "") as "Member User Type" | "Relationship",
          catalogName: String(p.catalogName ?? ""),
        }))
      : [],
    antecedentInterventionList: Array.isArray(data.antecedentInterventionList)
      ? data.antecedentInterventionList.map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
        }))
      : [],
    consequenceInterventionList: Array.isArray(data.consequenceInterventionList)
      ? data.consequenceInterventionList.map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
        }))
      : [],
  }
}

/**
 * Update an appointment note.
 * PUT /appointment/note
 */
export async function updateAppointmentNote(
  payload: UpdateAppointmentNotePayload,
): Promise<string> {
  const response = await servicePut<UpdateAppointmentNotePayload, string>(
    "/appointment/note",
    payload,
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to update appointment note"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  return payload.id
}
