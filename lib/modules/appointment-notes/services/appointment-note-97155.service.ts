import { serviceGet, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  AppointmentNote97155,
  CatalogItem,
  UpdateAppointmentNote97155Payload,
} from "@/lib/types/appointment-note-97155.types"
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

function parseCatalogItem(obj: unknown): CatalogItem | null {
  if (!obj || typeof obj !== "object") return null
  const rec = obj as Record<string, unknown>
  const id = String(rec.id ?? "")
  if (!id) return null
  return { id, name: String(rec.name ?? "") }
}

function parseCatalogArray(arr: unknown): CatalogItem[] {
  if (!Array.isArray(arr)) return []
  return arr
    .map((item) => parseCatalogItem(item))
    .filter((r): r is CatalogItem => r !== null)
}

function parseCatalogType(raw: unknown): AppointmentNoteParticipantCatalogType {
  const s = String(raw ?? "")
  if (s.toLowerCase().includes("relationship")) return "Relationship"
  return "Member User Type"
}

function parseClientCaregiver(obj: unknown) {
  if (!obj || typeof obj !== "object") return null
  const c = obj as Record<string, unknown>
  const id = String(c.id ?? "")
  if (!id) return null
  return {
    id,
    fullName: String(c.fullName ?? ""),
    relationshipId: String(c.relationshipId ?? ""),
    relationshipName: String(c.relationshipName ?? ""),
  }
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

/**
 * GET /appointment/{appointmentId}/note/97155
 */
export async function getAppointmentNote97155(
  appointmentId: string,
): Promise<AppointmentNote97155 | null> {
  const response = await serviceGet<unknown>(`/appointment/${appointmentId}/note/97155`)

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch 97155 appointment note"))
  }

  if (!response.data) return null

  const raw = response.data as Record<string, unknown>
  const data = (raw.entity ?? raw.data ?? raw) as Record<string, unknown>
  if (!data || !data.id) return null

  // Parse provider
  let provider: AppointmentNote97155["provider"] = null
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

  // Parse supervisionProvider — el técnico supervisado; viene null si el
  // appointment no tiene sub-event de supervisión activo
  let supervisionProvider: AppointmentNote97155["supervisionProvider"] = null
  if (data.supervisionProvider && typeof data.supervisionProvider === "object") {
    const sp = data.supervisionProvider as Record<string, unknown>
    const name = String(sp.name ?? "")
    const credential = String(sp.credential ?? "")
    if (name || credential) supervisionProvider = { name, credential }
  }

  // Parse recipient
  let recipient: AppointmentNote97155["recipient"] = null
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
  let serviceDetails: AppointmentNote97155["serviceDetails"] = null
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
  let modality: CatalogItem | null = null
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
    // Face-to-face protocol
    faceToFaceProtocol: parseCatalogItem(data.faceToFaceProtocol),
    faceToFaceProtocolShow: Boolean(data.faceToFaceProtocolShow),
    faceToFaceProtocolNarrative: String(data.faceToFaceProtocolNarrative ?? ""),
    // Protocol adjustments
    protocolAdjustments: parseCatalogArray(data.protocolAdjustments),
    protocolAdjustmentsShow: Boolean(data.protocolAdjustmentsShow),
    adjustmentsNarrative: String(data.adjustmentsNarrative ?? ""),
    // QHP implementation
    qhpImplementation: parseCatalogItem(data.qhpImplementation),
    qhpImplementationShow: Boolean(data.qhpImplementationShow),
    qhpNarrative: String(data.qhpNarrative ?? ""),
    // Active direction
    technicianNameAndCredentials: String(data.technicianNameAndCredentials ?? ""),
    activeDirections: parseCatalogArray(data.activeDirections),
    activeDirectionActivitiesShow: Boolean(data.activeDirectionActivitiesShow),
    activeDirectionNarrative: String(data.activeDirectionNarrative ?? ""),
    // Signatures
    caregiverSignatureImage: typeof data.caregiverSignatureImage === "string" ? data.caregiverSignatureImage : null,
    caregiverSignatureChecked: typeof data.caregiverSignatureChecked === "boolean" ? data.caregiverSignatureChecked : null,
    clientCaregiver: parseClientCaregiver(data.clientCaregiver),
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
    supervisionProvider,
    recipient,
    serviceDetails,
    billingCodes: typeof data.billingCodes === "string" ? data.billingCodes : null,
  }
}

/**
 * PUT /appointment/note/97155
 */
export async function updateAppointmentNote97155(
  payload: UpdateAppointmentNote97155Payload,
): Promise<string> {
  const response = await servicePut<UpdateAppointmentNote97155Payload, string>(
    "/appointment/note/97155",
    payload,
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to update 97155 appointment note"))
  }

  const data = response.data as unknown
  if (typeof data === "string") return data
  return payload.id
}
