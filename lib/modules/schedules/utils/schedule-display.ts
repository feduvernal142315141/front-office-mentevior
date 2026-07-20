import { format, parseISO } from "date-fns"
import type { Appointment, EventType } from "@/lib/types/appointment.types"
import { formatTime } from "@/lib/date"

export type CalendarViewMode = "general" | "client"

const DEFAULT_EVENT_COLORS: Record<EventType, string> = {
  session_note: "#037ECC",
  service_plan: "#079CFB",
  supervision: "#6366f1",
}

/** Calendar label: session_note → "Session" per RN-SCH-04 */
export function getCalendarEventTypeLabel(eventType?: EventType): string {
  switch (eventType) {
    case "service_plan":
      return "Service Plan"
    case "supervision":
      return "Supervision"
    default:
      return "Session"
  }
}

export function getEventColor(
  eventType: EventType | undefined,
  colors?: Partial<Record<EventType, string>>,
): string {
  const key = eventType ?? "session_note"
  return colors?.[key] ?? DEFAULT_EVENT_COLORS[key]
}

export function formatAppointmentUnits(appointment: Appointment): number | null {
  const units = appointment.units ?? appointment.cantUnit
  if (units == null || Number.isNaN(Number(units))) return null
  return Number(units)
}

export function formatAppointmentTimeRange(appointment: Appointment): string {
  const units = formatAppointmentUnits(appointment)
  const timeRange = `${formatTime(appointment.startsAt)} - ${formatTime(appointment.endsAt)}`
  return units != null ? `${timeRange} (${units})` : timeRange
}

export function formatAppointmentDateLine(appointment: Appointment): string {
  const date = appointment.date ?? format(parseISO(appointment.startsAt), "MM/dd/yyyy")
  const units = formatAppointmentUnits(appointment)
  const timeRange = `${formatTime(appointment.startsAt)} - ${formatTime(appointment.endsAt)}`
  const unitsSuffix = units != null ? ` | ${units} Units` : ""
  return `${date} | ${timeRange}${unitsSuffix}`
}

export function getAppointmentBillingCodeLabel(appointment: Appointment): string {
  return appointment.billingCodeName?.trim() || "—"
}

export function isAppointmentInProgress(appointment: Appointment): boolean {
  const now = new Date()
  const start = parseISO(appointment.startsAt)
  const end = parseISO(appointment.endsAt)
  return now >= start && now <= end
}

export function buildSessionNoteUrl(appointment: Appointment): string {
  const params = new URLSearchParams({
    appointmentId: appointment.id,
    clientId: appointment.clientId,
    date: appointment.date ?? format(parseISO(appointment.startsAt), "yyyy-MM-dd"),
  })
  if (appointment.billingCodeName) {
    params.set("billingCode", appointment.billingCodeName)
  }
  if (isAppointmentInProgress(appointment)) {
    params.set("mode", "readonly")
  }
  return `/session-note?${params.toString()}`
}

export function buildDataCollectionUrl(appointment: Appointment): string {
  const base = `/clients/${appointment.clientId}/configuration?section=data-collection&spId=${appointment.clientServicePlanId}&appointmentId=${appointment.id}`
  return appointment.date ? `${base}&appointmentDate=${appointment.date}` : base
}

export function matchesLocationFilter(
  appointment: Appointment,
  filterLocation: string,
): boolean {
  if (filterLocation === "all") return true
  const label = (appointment.addressLabel ?? appointment.location).toLowerCase()
  return label.includes(filterLocation.toLowerCase())
}
