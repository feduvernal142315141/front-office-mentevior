import { serviceGet, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  AppointmentNote,
  AppointmentNoteParticipantCatalogType,
  UpdateAppointmentNotePayload,
} from "@/lib/types/appointment-note.types"

function parseTeachingMethod(data: Record<string, unknown>) {
  if (data.teachingMethod && typeof data.teachingMethod === "object") {
    const tm = data.teachingMethod as Record<string, unknown>
    const id = String(tm.id ?? "")
    return id ? { id, name: String(tm.name ?? "") } : null
  }
  const tmId = String(data.teachingMethodId ?? "")
  return tmId ? { id: tmId, name: String(data.teachingMethodName ?? "") } : null
}

function parseModality(data: Record<string, unknown>) {
  if (data.modality && typeof data.modality === "object") {
    const m = data.modality as Record<string, unknown>
    const id = String(m.id ?? "")
    return id ? { id, name: String(m.name ?? "") } : null
  }
  return null
}

function parseRecipient(data: Record<string, unknown>) {
  if (data.recipient && typeof data.recipient === "object") {
    const r = data.recipient as Record<string, unknown>
    return {
      name: String(r.name ?? ""),
      dateOfBirth: String(r.dateOfBirth ?? ""),
      insuranceNumber: String(r.insuranceNumber ?? ""),
      diagnosis: String(r.diagnosis ?? ""),
    }
  }
  return null
}

function parseProvider(data: Record<string, unknown>) {
  if (data.provider && typeof data.provider === "object") {
    const p = data.provider as Record<string, unknown>
    return {
      name: String(p.name ?? ""),
      credential: String(p.credential ?? ""),
      npi: String(p.npi ?? ""),
      mpi: String(p.mpi ?? ""),
    }
  }
  return null
}

function parseCatalogType(raw: unknown): AppointmentNoteParticipantCatalogType {
  const s = String(raw ?? "")
  if (s.toLowerCase().includes("relationship")) return "Relationship"
  return "Member User Type"
}

function parseParticipant(p: Record<string, unknown>) {
  // Backend may use catalogId/catalogType or memberUserTypeId/relationshipId
  if (p.catalogId) {
    return {
      id: String(p.id ?? ""),
      catalogId: String(p.catalogId),
      catalogType: parseCatalogType(p.catalogType),
      catalogName: String(p.catalogName ?? p.name ?? ""),
    }
  }
  // Fallback: memberUserTypeId/relationshipId → convert to catalog format
  if (p.memberUserTypeId) {
    return {
      id: String(p.id ?? ""),
      catalogId: String(p.memberUserTypeId),
      catalogType: "Member User Type" as AppointmentNoteParticipantCatalogType,
      catalogName: String(p.memberUserTypeName ?? ""),
    }
  }
  if (p.relationshipId) {
    return {
      id: String(p.id ?? ""),
      catalogId: String(p.relationshipId),
      catalogType: "Relationship" as AppointmentNoteParticipantCatalogType,
      catalogName: String(p.relationshipName ?? ""),
    }
  }
  return {
    id: String(p.id ?? ""),
    catalogId: "",
    catalogType: "Member User Type" as AppointmentNoteParticipantCatalogType,
    catalogName: "",
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
  const data = (raw.entity ?? raw.data ?? raw) as Record<string, unknown>
  if (!data || !data.id) return null

  return {
    id: String(data.id ?? ""),
    appointmentId: String(data.appointmentId ?? appointmentId),
    recipient: parseRecipient(data),
    provider: parseProvider(data),
    billingCodes: typeof data.billingCodes === "string" ? data.billingCodes : null,
    modality: parseModality(data),
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
                environmentalChange: typeof item.environmentalChange === "string" ? item.environmentalChange : null,
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

/**
 * Get appointment note PDF preview as a blob URL.
 * GET /reports/appointment-note/preview?appointmentId={id}
 */
export async function getAppointmentNotePdfUrl(
  appointmentId: string,
): Promise<string> {
  const response = await serviceGet<unknown>(
    `/reports/appointment-note/preview?appointmentId=${appointmentId}`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to generate PDF preview"))
  }

  const raw = response.data as Record<string, unknown>
  const base64 = (raw.fileBase64 ?? raw.data ?? "") as string
  if (!base64) throw new Error("Empty PDF response")

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: "application/pdf" })
  return URL.createObjectURL(blob)
}
