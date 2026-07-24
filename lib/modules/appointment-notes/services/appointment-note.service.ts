import { serviceGet, servicePut, servicePatch } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  AppointmentNote,
  AppointmentNoteParticipantCatalogType,
  AppointmentNoteSummary,
  NoteStatus,
  UpdateAppointmentNotePayload,
} from "@/lib/types/appointment-note.types"
import type { PaginatedResponse } from "@/lib/types/response.types"

function parseNoteStatus(data: Record<string, unknown>): NoteStatus {
  const raw = String(data.noteStatus ?? data.status ?? "").toLowerCase()
  if (raw === "active" || raw === "close" || raw === "lock" || raw === "read") return raw
  // Legacy fallback: derive from blocked/notCanEdit
  const blocked = Boolean(data.blocked)
  const notCanEdit = Boolean(data.notCanEdit)
  if (blocked && notCanEdit) return "lock"
  if (blocked || notCanEdit) return "close"
  return "active"
}

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
      sign: String(p.sign ?? ""),
    }
  }
  return null
}

function parseServiceDetails(data: Record<string, unknown>) {
  if (data.serviceDetails && typeof data.serviceDetails === "object") {
    const sd = data.serviceDetails as Record<string, unknown>
    return {
      date: typeof sd.date === "string" ? sd.date : null,
      placeOfService: typeof sd.placeOfService === "string" ? sd.placeOfService : null,
      timeInOut: typeof sd.timeInOut === "string" ? sd.timeInOut : null,
      hours: typeof sd.hours === "string" ? sd.hours : null,
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
    type: (String(data.type ?? "Session Note") as import("@/lib/types/appointment-note.types").NoteType),
    recipient: parseRecipient(data),
    provider: parseProvider(data),
    serviceDetails: parseServiceDetails(data),
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
                type: typeof item.type === "string" ? item.type : null,
              }))
            : [],
        }))
      : [],
    useCheckmarkSignature: Boolean(data.useCheckmarkSignature),
    caregiverSignatureImage: typeof data.caregiverSignatureImage === "string" ? data.caregiverSignatureImage : null,
    caregiverSignatureChecked: typeof data.caregiverSignatureChecked === "boolean" ? data.caregiverSignatureChecked : null,
    noteStatus: parseNoteStatus(data),
    blocked: Boolean(data.blocked),
    notCanEdit: Boolean(data.notCanEdit),
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

const DEFAULT_SESSION_NOTE_PDF_NAME = "Session Note.pdf"

/**
 * Same-origin preview URL for the built-in browser PDF viewer.
 * The filename is part of the path so Chrome's Save As uses it (not a blob UUID).
 * Auth is handled server-side via the httpOnly `mv_fo_token` cookie.
 */
export function getAppointmentNotePdfPreviewUrl(
  appointmentId: string,
  fileName: string = DEFAULT_SESSION_NOTE_PDF_NAME,
): string {
  const safeName = encodeURIComponent(fileName || DEFAULT_SESSION_NOTE_PDF_NAME)
  return `/api/reports/appointment-note/preview/${safeName}?appointmentId=${encodeURIComponent(appointmentId)}`
}

/** @deprecated Prefer getAppointmentNotePdfPreviewUrl for native viewer download names. */
export function getAppointmentNotePdfUrl(appointmentId: string): string {
  return getAppointmentNotePdfPreviewUrl(appointmentId)
}

/**
 * Fetch paginated list of appointment notes.
 * GET /appointment/note
 */
export async function getAppointmentNotes(params?: {
  filters?: string[]
  orders?: string[]
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<AppointmentNoteSummary>> {
  const qs = new URLSearchParams()
  if (params?.filters?.length) {
    for (const f of params.filters) qs.append("filters", f)
  }
  if (params?.orders?.length) {
    for (const o of params.orders) qs.append("orders", o)
  }
  if (params?.page !== undefined) qs.set("page", String(params.page))
  if (params?.pageSize !== undefined) qs.set("pageSize", String(params.pageSize))
  const query = qs.toString()

  const url = `/appointment/note${query ? `?${query}` : ""}`
  const response = await serviceGet<PaginatedResponse<AppointmentNoteSummary>>(url)

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch appointment notes"))
  }

  const raw = response.data as unknown as Record<string, unknown>
  const entities = (Array.isArray(raw.entities) ? raw.entities : []) as Record<string, unknown>[]
  const pagination = (raw.pagination ?? { page: 0, pageSize: 10, total: 0 }) as PaginatedResponse<AppointmentNoteSummary>["pagination"]

  return {
    entities: entities.map((e) => ({
      id: String(e.id ?? ""),
      appointmentId: String(e.appointmentId ?? ""),
      clientName: String(e.clientName ?? ""),
      providerName: String(e.providerName ?? ""),
      date: String(e.date ?? ""),
      timeInit: e.timeInit ? String(e.timeInit) : undefined,
      timeEnd: e.timeEnd ? String(e.timeEnd) : undefined,
      billingCodeId: String(e.billingCodeId ?? ""),
      billingCode: String(e.billingCode ?? ""),
      noteStatus: parseNoteStatus(e as Record<string, unknown>),
      type: (String(e.type ?? "") || undefined) as import("@/lib/types/appointment-note.types").NoteType | undefined,
    })),
    pagination,
  }
}

/**
 * Lock an appointment note (admin action).
 * PATCH /appointment/note/lock
 * Only allowed when appointment is Completed and note status is Close.
 */
export async function lockAppointmentNote(
  appointmentId: string,
): Promise<string | null> {
  try {
    const response = await servicePatch<{ appointmentId: string }, string>(
      "/appointment/note/lock",
      { appointmentId },
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
