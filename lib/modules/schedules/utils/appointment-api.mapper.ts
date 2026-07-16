import {
  formatBillingCodeLabel,
} from "@/lib/utils/billing-code-display"
import { format, parseISO } from "date-fns"
import type {
  ApiAppointmentItem,
  Appointment,
  AppointmentApiPayload,
  AppointmentFormData,
  AppointmentStatus,
  AppointmentSupervisionApiPayload,
  AppointmentTypeEvent,
  EventType,
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

function toFormTime(value?: string): string {
  if (!value) return ""
  return value.length >= 5 ? value.slice(0, 5) : value
}

/** Resolves units from API fields (`units` or `cantUnit`). */
export function resolveApiUnits(
  units?: number | string | null,
  cantUnit?: number | string | null,
): number | null {
  const raw = units ?? cantUnit
  if (raw == null || raw === "") return null
  const num = Number(raw)
  return Number.isNaN(num) ? null : num
}

export function buildSupervisionValidateKey(
  clientId: string,
  supervision: Pick<
    AppointmentFormData["supervision"],
    "billingCodeId" | "startTime" | "endTime" | "date"
  >,
): string {
  return `${clientId}|${supervision.billingCodeId}|${supervision.startTime}|${supervision.endTime}|${supervision.date}|supervision`
}

function supervisionApiToFormData(
  supervision: AppointmentSupervisionApiPayload,
): AppointmentFormData["supervision"] {
  return {
    title: supervision.title ?? "",
    providerId: supervision.providerId ?? "",
    billingCodeId: supervision.billingCodeId ?? "",
    date: supervision.date ?? "",
    startTime: toFormTime(supervision.timeInit),
    endTime: toFormTime(supervision.timeEnd),
    priorAuthorizationId: supervision.priorAuthorizationId ?? "",
    approvedPriorAuthorizationBillingCodeId: "",
    validatedUnits: resolveApiUnits(supervision.units),
  }
}

export function appointmentToFormData(appointment: Appointment): AppointmentFormData {
  const date =
    appointment.date ??
    (appointment.startsAt ? format(parseISO(appointment.startsAt), "yyyy-MM-dd") : "")

  const startTime = appointment.timeInit
    ? toFormTime(appointment.timeInit)
    : appointment.startsAt
      ? format(parseISO(appointment.startsAt), "HH:mm")
      : ""

  const endTime = appointment.timeEnd
    ? toFormTime(appointment.timeEnd)
    : appointment.endsAt
      ? format(parseISO(appointment.endsAt), "HH:mm")
      : ""

  const billingCodeId =
    appointment.billingCodeId ?? appointment.billingCodeIds?.[0] ?? ""

  const placeOfServiceAddressId =
    appointment.placeOfServiceAddressId ?? appointment.clientAddressId ?? ""

  const supervision = appointment.supervision
    ? supervisionApiToFormData(appointment.supervision)
    : {
        ...createEmptySupervisionForm(),
        providerId: appointment.supervisionRbtId ?? "",
        billingCodeId: appointment.supervisionBillingCodeIds?.[0] ?? "",
      }

  return {
    eventType: appointment.eventType ?? fromApiEventType(),
    clientId: appointment.clientId ?? "",
    placeOfServiceAddressId,
    date,
    startTime,
    endTime,
    billingCodeId,
    priorAuthorizationId: appointment.priorAuthorizationId ?? "",
    approvedPriorAuthorizationBillingCodeId: "",
    validatedUnits: resolveApiUnits(appointment.units, appointment.cantUnit),
    addSupervision: appointment.addSupervision ?? !!appointment.supervision,
    supervision,
  }
}

export function buildMainValidateKey(form: Pick<
  AppointmentFormData,
  "clientId" | "billingCodeId" | "startTime" | "endTime" | "date" | "eventType"
>): string {
  return `${form.clientId}|${form.billingCodeId}|${form.startTime}|${form.endTime}|${form.date}|${form.eventType}`
}

export function fromApiAppointment(api: ApiAppointmentItem): Appointment {
  const date = api.date ?? ""
  const timeInit = api.timeInit ?? "00:00:00"
  const timeEnd = api.timeEnd ?? "00:00:00"

  const billingCodeName =
    formatBillingCodeLabel(api as unknown as Record<string, unknown>) ||
    api.billingCodeName ||
    (api.billingCode ? `CPT ${api.billingCode}` : undefined)

  const addressLabel =
    api.clientAddressNickName?.trim() ||
    api.clientAddressName?.trim() ||
    undefined

  const resolvedUnits = resolveApiUnits(api.units, api.cantUnit)

  return {
    id: api.id,
    rbtId: api.providerId ?? "",
    clientId: api.clientId ?? "",
    clientName: api.clientFullName ?? api.clientName,
    serviceId: "",
    location: "Clinic",
    startsAt: date ? combineDateAndTime(date, timeInit) : new Date().toISOString(),
    endsAt: date ? combineDateAndTime(date, timeEnd) : new Date().toISOString(),
    status: normalizeAppointmentStatus(api.appointmentStatusName || api.status),
    eventType: fromApiEventType(api.typeEvent),
    placeOfServiceAddressId: api.clientAddressId,
    clientAddressId: api.clientAddressId,
    addressLabel,
    providerName: api.providerName,
    billingCodeId: api.billingCodeId,
    billingCodeIds: api.billingCodeId ? [api.billingCodeId] : [],
    billingCodeName,
    priorAuthorizationId: api.priorAuthorizationId,
    priorAuthorizationNumber: api.priorAuthorizationNumber,
    units: resolvedUnits ?? undefined,
    cantUnit: resolvedUnits ?? undefined,
    date: api.date,
    timeInit: api.timeInit,
    timeEnd: api.timeEnd,
    addSupervision: !!api.supervision,
    supervision: api.supervision,
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
    approvedPriorAuthorizationBillingCodeId: "",
    validatedUnits: null,
  }
}
