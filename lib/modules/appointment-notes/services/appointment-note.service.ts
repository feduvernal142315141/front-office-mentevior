import { serviceGet, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  AppointmentNote,
  UpdateAppointmentNotePayload,
} from "@/lib/types/appointment-note.types"

function parseTeachingMethod(data: Record<string, unknown>) {
  // Nested object: { teachingMethod: { id, name } }
  if (data.teachingMethod && typeof data.teachingMethod === "object") {
    const tm = data.teachingMethod as Record<string, unknown>
    const id = String(tm.id ?? "")
    return id ? { id, name: String(tm.name ?? "") } : null
  }
  // Flat fields: { teachingMethodId, teachingMethodName }
  const tmId = String(data.teachingMethodId ?? "")
  return tmId
    ? { id: tmId, name: String(data.teachingMethodName ?? "") }
    : null
}

function parseParticipant(p: Record<string, unknown>) {
  // New structure: { memberUserTypeId, memberUserTypeName, relationshipId, relationshipName }
  if (p.memberUserTypeId || p.relationshipId) {
    return {
      id: String(p.id ?? ""),
      memberUserTypeId: p.memberUserTypeId ? String(p.memberUserTypeId) : null,
      memberUserTypeName: p.memberUserTypeName ? String(p.memberUserTypeName) : null,
      relationshipId: p.relationshipId ? String(p.relationshipId) : null,
      relationshipName: p.relationshipName ? String(p.relationshipName) : null,
    }
  }
  // Fallback: legacy { catalogId, catalogType, catalogName }
  const catalogType = String(p.catalogType ?? "")
  const catalogId = String(p.catalogId ?? "")
  const catalogName = String(p.catalogName ?? "")
  if (catalogType === "Member User Type") {
    return {
      id: String(p.id ?? ""),
      memberUserTypeId: catalogId,
      memberUserTypeName: catalogName,
      relationshipId: null,
      relationshipName: null,
    }
  }
  return {
    id: String(p.id ?? ""),
    memberUserTypeId: null,
    memberUserTypeName: null,
    relationshipId: catalogId,
    relationshipName: catalogName,
  }
}

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
    teachingMethod: parseTeachingMethod(data),
    reasonCaregiverNotPresent: String(data.reasonCaregiverNotPresent ?? ""),
    medicalConcerns: String(data.medicalConcerns ?? ""),
    crisisInvolved: Boolean(data.crisisInvolved),
    sessionSummary: String(data.sessionSummary ?? ""),
    participants: Array.isArray(data.participants)
      ? data.participants.map((p: Record<string, unknown>) => parseParticipant(p))
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
    categories: Array.isArray(data.categories)
      ? data.categories.map((cat: Record<string, unknown>) => ({
          id: String(cat.id ?? ""),
          name: String(cat.name ?? ""),
          items: Array.isArray(cat.items)
            ? cat.items.map((item: Record<string, unknown>) => ({
                id: String(item.id ?? ""),
                name: String(item.name ?? ""),
                dataCollectionId: item.dataCollectionId ? String(item.dataCollectionId) : null,
                value: typeof item.value === "number" ? item.value : null,
              }))
            : [],
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
