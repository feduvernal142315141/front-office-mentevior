import type {
  ApiAppointmentItem,
  Appointment,
  AppointmentFormData,
  AppointmentStatus,
  AppointmentTypeEvent,
  EventType,
} from "@/lib/types/appointment.types"
import type {
  AppointmentApiPayload,
  AppointmentSupervisionApiPayload,
} from "@/lib/types/appointment.types"

export function toApiEventType(eventType: EventType): AppointmentTypeEvent {
  switch (eventType) {
    case "session_note":
      return "Session Note"
    case "service_plan":
      return "Service Plan"
    case "supervision":
      return "Supervision"
  }
}

export function fromApiEventType(value?: string): EventType {
  switch (value) {
    case "Service Plan":
      return "service_plan"
    case "Supervision":
      return "supervision"
    default:
      return "session_note"
  }
}

/** Form HH:mm → API Time HH:mm:ss */
export function toApiTime(time: string): string {
  if (!time) return ""
  return time.length === 5 ? `${time}:00` : time
}

/** Form HH:mm → validate endpoint HH:mm */
export function toValidateTime(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time
}

export function buildAppointmentApiPayload(
  form: AppointmentFormData,
  providerId: string,
  units: number,
): AppointmentApiPayload {
  const payload: AppointmentApiPayload = {
    clientAddressId: form.placeOfServiceAddressId,
    cantUnit: units,
    units,
    timeInit: toApiTime(form.startTime),
    timeEnd: toApiTime(form.endTime),
    date: form.date,
    billingCodeId: form.billingCodeId,
    typeEvent: toApiEventType(form.eventType),
    providerId,
    priorAuthorizationId: form.priorAuthorizationId,
  }

  if (form.addSupervision && form.supervision.billingCodeId) {
    const supUnits = form.supervision.validatedUnits ?? units
    payload.supervision = {
      title: form.supervision.title.trim() || "Supervision",
      timeInit: toApiTime(form.supervision.startTime),
      timeEnd: toApiTime(form.supervision.endTime),
      date: form.supervision.date || form.date,
      billingCodeId: form.supervision.billingCodeId,
      units: supUnits,
      priorAuthorizationId: form.supervision.priorAuthorizationId,
      providerId: form.supervision.providerId || providerId,
    }
  }

  return payload
}

function combineDateAndTime(date: string, time: string): string {
  const normalizedTime = time.length >= 5 ? time.slice(0, 5) : time
  return new Date(`${date}T${normalizedTime}`).toISOString()
}

export function normalizeAppointmentStatus(status?: string): AppointmentStatus {
  if (!status) return "Scheduled"

  const normalized = status.replace(/[\s_-]/g, "").toLowerCase()
  if (normalized === "inprogress") return "InProgress"
  if (normalized === "completed") return "Completed"
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled"
  if (normalized === "noshow") return "NoShow"
  return "Scheduled"
}

export function getEventTypeLabel(eventType?: EventType): string {
  switch (eventType) {
    case "service_plan":
      return "Service Plan"
    case "supervision":
      return "Supervision"
    default:
      return "Session Note"
  }
}

export function fromApiAppointment(api: ApiAppointmentItem): Appointment {
  const date = api.date ?? ""
  const timeInit = api.timeInit ?? "00:00:00"
  const timeEnd = api.timeEnd ?? "00:00:00"

  return {
    id: api.id,
    rbtId: api.providerId ?? "",
    clientId: api.clientId ?? "",
    clientName: api.clientFullName ?? api.clientName,
    serviceId: "",
    location: "Clinic",
    startsAt: date ? combineDateAndTime(date, timeInit) : new Date().toISOString(),
    endsAt: date ? combineDateAndTime(date, timeEnd) : new Date().toISOString(),
    status: normalizeAppointmentStatus(api.status),
    eventType: fromApiEventType(api.typeEvent),
    placeOfServiceAddressId: api.clientAddressId,
    addressLabel: api.clientAddressName,
    billingCodeId: api.billingCodeId,
    billingCodeIds: api.billingCodeId ? [api.billingCodeId] : [],
    billingCodeName: api.billingCodeName,
    priorAuthorizationId: api.priorAuthorizationId,
    units: api.units ?? api.cantUnit,
    addSupervision: !!api.supervision,
    supervisionRbtId: api.supervision?.providerId,
    supervisionBillingCodeIds: api.supervision?.billingCodeId
      ? [api.supervision.billingCodeId]
      : undefined,
  }
}

export function createEmptySupervisionForm(): AppointmentFormData["supervision"] {
  return {
    title: "",
    providerId: "",
    billingCodeId: "",
    date: "",
    startTime: "",
    endTime: "",
    priorAuthorizationId: "",
    validatedUnits: null,
  }
}
