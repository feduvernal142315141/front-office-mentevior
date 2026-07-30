import { serviceGet, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  AppointmentNote97156,
  AppointmentNote97156Caregiver,
  AppointmentNote97156Intervention,
  UpdateAppointmentNote97156Payload,
} from "@/lib/types/appointment-note-97156.types"
import type { AppointmentNoteParticipantCatalogType, NoteStatus } from "@/lib/types/appointment-note.types"

function parseNoteStatus(data: Record<string, unknown>): NoteStatus {
  const raw = String(data.noteStatus ?? data.status ?? "").toLowerCase()
  if (raw === "active" || raw === "close" || raw === "lock" || raw === "read") return raw
  const blocked = Boolean(data.blocked)
  const notCanEdit = Boolean(data.notCanEdit)
  if (blocked && notCanEdit) return "lock"
  if (blocked || notCanEdit) return "close"
  return "active"
}

function parseCatalogType(raw: unknown): AppointmentNoteParticipantCatalogType {
  const s = String(raw ?? "")
  if (s.toLowerCase().includes("relationship")) return "Relationship"
  return "Member User Type"
}

function parseParticipant(p: Record<string, unknown>) {
  if (p.catalogId) {
    return {
      id: String(p.id ?? ""),
      catalogId: String(p.catalogId),
      catalogType: parseCatalogType(p.catalogType),
      catalogName: String(p.catalogName ?? p.name ?? ""),
    }
  }
  if (p.memberUserTypeId) {
    return {
      id: String(p.id ?? ""),
      catalogId: String(p.memberUserTypeId),
      catalogType: "Member User Type" as AppointmentNoteParticipantCatalogType,
      catalogName: String(p.memberUserTypeName ?? ""),
    }
  }
  return {
    id: String(p.id ?? ""),
    catalogId: "",
    catalogType: "Member User Type" as AppointmentNoteParticipantCatalogType,
    catalogName: "",
  }
}

function parseCaregivers(arr: unknown): AppointmentNote97156Caregiver[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const c = item as Record<string, unknown>
      return {
        id: String(c.id ?? ""),
        fullName: String(c.fullName ?? ""),
        relationshipId: String(c.relationshipId ?? ""),
        relationshipName: String(c.relationshipName ?? ""),
      }
    })
    .filter((c) => c.id.length > 0)
}

function parseInterventions(arr: unknown): AppointmentNote97156Intervention[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const i = item as Record<string, unknown>
      return {
        id: String(i.id ?? ""),
        name: String(i.name ?? ""),
      }
    })
    .filter((i) => i.id.length > 0)
}

/**
 * GET /appointment/{appointmentId}/note/97156
 */
export async function getAppointmentNote97156(
  appointmentId: string,
): Promise<AppointmentNote97156 | null> {
  const response = await serviceGet<unknown>(`/appointment/${appointmentId}/note/97156`)

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch 97156 appointment note"))
  }

  if (!response.data) return null

  const raw = response.data as Record<string, unknown>
  const data = (raw.entity ?? raw.data ?? raw) as Record<string, unknown>
  if (!data || !data.id) return null

  // Parse provider
  let provider: AppointmentNote97156["provider"] = null
  if (data.provider && typeof data.provider === "object") {
    const p = data.provider as Record<string, unknown>
    provider = {
      name: String(p.name ?? ""),
      credential: String(p.credential ?? ""),
      npi: String(p.npi ?? ""),
      mpi: String(p.mpi ?? ""),
      sign: String(p.sign ?? ""),
    }
  }

  // Parse recipient
  let recipient: AppointmentNote97156["recipient"] = null
  if (data.recipient && typeof data.recipient === "object") {
    const r = data.recipient as Record<string, unknown>
    recipient = {
      name: String(r.name ?? ""),
      dateOfBirth: String(r.dateOfBirth ?? ""),
      insuranceNumber: String(r.insuranceNumber ?? ""),
      diagnosis: String(r.diagnosis ?? ""),
    }
  }

  // Parse serviceDetails
  let serviceDetails: AppointmentNote97156["serviceDetails"] = null
  if (data.serviceDetails && typeof data.serviceDetails === "object") {
    const sd = data.serviceDetails as Record<string, unknown>
    serviceDetails = {
      date: typeof sd.date === "string" ? sd.date : null,
      placeOfService: typeof sd.placeOfService === "string" ? sd.placeOfService : null,
      timeInOut: typeof sd.timeInOut === "string" ? sd.timeInOut : null,
      hours: typeof sd.hours === "string" ? sd.hours : null,
    }
  }

  // Parse modality
  let modality: AppointmentNote97156["modality"] = null
  if (data.modality && typeof data.modality === "object") {
    const m = data.modality as Record<string, unknown>
    const id = String(m.id ?? "")
    if (id) modality = { id, name: String(m.name ?? "") }
  }

  return {
    id: String(data.id ?? ""),
    appointmentId: String(data.appointmentId ?? appointmentId),
    modality,
    reasonCaregiverNotPresent: String(data.reasonCaregiverNotPresent ?? ""),
    medicalConcerns: String(data.medicalConcerns ?? ""),
    crisisInvolved: Boolean(data.crisisInvolved),
    // Session participants
    caregivers: parseCaregivers(data.caregivers),
    clientPresent: Boolean(data.clientPresent),
    // Interventions
    interventions: parseInterventions(data.interventions),
    // Session summary
    goals: String(data.goals ?? ""),
    sessionSummary: String(data.sessionSummary ?? ""),
    // Data collection (categories)
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
                type: typeof item.type === "string" ? item.type : null,
                typeEventCatalogId: item.typeEventCatalogId ? String(item.typeEventCatalogId) : null,
                typeEventCatalogName: typeof item.typeEventCatalogName === "string" ? item.typeEventCatalogName : null,
                baseline: Array.isArray(item.baseline)
                  ? item.baseline.map((b: Record<string, unknown>) => ({
                      id: String(b.id ?? ""),
                      date: String(b.date ?? ""),
                      value: typeof b.value === "number" ? b.value : 0,
                      periodCatalogId: String(b.periodCatalogId ?? ""),
                      environmentalChanges: typeof b.environmentalChanges === "string" ? b.environmentalChanges : undefined,
                      show: b.show !== false,
                    }))
                  : [],
                objetive: Array.isArray(item.objetive)
                  ? item.objetive.map((o: Record<string, unknown>) => ({
                      id: String(o.id ?? ""),
                      name: String(o.name ?? ""),
                      statusId: o.statusId ? String(o.statusId) : undefined,
                      status: o.status ? String(o.status) : undefined,
                      startDate: String(o.startDate ?? ""),
                      estimatedEndDate: o.estimatedEndDate ? String(o.estimatedEndDate) : null,
                      endDate: o.endDate ? String(o.endDate) : "",
                      operatorSmartCriteria: String(o.operatorSmartCriteria ?? ""),
                      valueSmartCriteria: typeof o.valueSmartCriteria === "number" ? o.valueSmartCriteria : 0,
                      periodSmartCriteriaCatalogId: String(o.periodSmartCriteriaCatalogId ?? ""),
                      valueDuration: typeof o.valueDuration === "number" ? o.valueDuration : 0,
                      periodDurationCatalogId: String(o.periodDurationCatalogId ?? ""),
                    }))
                  : [],
              }))
            : [],
        }))
      : [],
    // Signatures
    caregiverSignatureImage: typeof data.caregiverSignatureImage === "string" ? data.caregiverSignatureImage : null,
    caregiverSignatureChecked: typeof data.caregiverSignatureChecked === "boolean" ? data.caregiverSignatureChecked : null,
    useCheckmarkSignature: Boolean(data.useCheckmarkSignature),
    // Status
    noteStatus: parseNoteStatus(data),
    blocked: Boolean(data.blocked),
    notCanEdit: Boolean(data.notCanEdit),
    // Participants
    participants: Array.isArray(data.participants)
      ? data.participants.map((p: Record<string, unknown>) => parseParticipant(p))
      : [],
    // Context
    provider,
    recipient,
    serviceDetails,
    billingCodes: typeof data.billingCodes === "string" ? data.billingCodes : null,
  }
}

/**
 * PUT /appointment/note/97156
 */
export async function updateAppointmentNote97156(
  payload: UpdateAppointmentNote97156Payload,
): Promise<string> {
  const response = await servicePut<UpdateAppointmentNote97156Payload, string>(
    "/appointment/note/97156",
    payload,
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to update 97156 appointment note"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  return payload.id
}
