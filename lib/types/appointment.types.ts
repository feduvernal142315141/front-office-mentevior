// ============================================
// APPOINTMENT TYPES
// Domain types for the scheduling module
// ============================================

/**
 * Possible status values for an appointment
 */
export type AppointmentStatus =
  | "Scheduled"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "NoShow"

/**
 * Event type determines the clinical context and available billing codes
 */
export type EventType = "session_note" | "service_plan" | "supervision"

/** Backend AppointmentTypeEvent enum values */
export type AppointmentTypeEvent = "Session Note" | "Service Plan" | "Supervision"

/** Billing code item from config endpoints (appointment / service-plan / supervision) */
export interface ConfigBillingCodeItem {
  id: string
  type?: string
  /** Billing code number — mapped from API `name` field */
  code?: string
  modifier?: string
  /** Pre-formatted label for selects: "CPT 97151 (TS)" */
  label: string
}

/** POST /appointment/validate-event-data request */
export interface ValidateEventDataRequest {
  clientId: string
  billingCodeId: string
  startTime: string
  endTime: string
  appointmentTypeEvent: AppointmentTypeEvent
}

/** POST /appointment/validate-event-data response */
export interface ValidateEventDataResponse {
  unitsToUse: number
  approvedPriorAuthorizationBillingCodeId: string
  priorAuthorizationId: string
}

/** Supervision sub-event payload for POST/PUT /appointment and GET /appointment/{id} */
export interface AppointmentSupervisionApiPayload {
  title: string
  timeInit: string
  timeEnd: string
  date: string
  billingCodeId: string
  units: number
  priorAuthorizationId: string
  providerId: string
  providerName?: string
}

/** Item returned by GET /appointment */
export interface ApiAppointmentItem {
  id: string
  clientAddressId?: string
  clientAddressNickName?: string
  clientId?: string
  clientFullName?: string
  clientName?: string
  clientAddressName?: string
  cantUnit?: number
  units?: number
  timeInit?: string
  timeEnd?: string
  date?: string
  billingCodeId?: string
  billingCode?: string
  billingCodeName?: string
  billingCodeType?: string
  billingCodeCode?: string
  billingCodeModifier?: string
  typeEvent?: string
  providerId?: string
  providerName?: string
  priorAuthorizationId?: string
  priorAuthorizationNumber?: string
  appointmentStatusId?: string | null
  appointmentStatusName?: string
  status?: string
  active?: boolean
  supervision?: AppointmentSupervisionApiPayload
}

/** Query params for GET /appointment */
export interface AppointmentListQuery {
  providerId?: string
  dateFrom?: string
  dateTo?: string
}

/** POST /appointment and PUT /appointment request body */
export interface AppointmentApiPayload {
  id?: string
  clientAddressId: string
  cantUnit: number
  units: number
  timeInit: string
  timeEnd: string
  date: string
  billingCodeId: string
  typeEvent: AppointmentTypeEvent
  providerId: string
  priorAuthorizationId: string
  supervision?: AppointmentSupervisionApiPayload
}

/**
 * @deprecated Use place-of-service from client addresses instead
 */
export type AppointmentLocation =
  | "Clinic"
  | "Home"
  | "School"
  | "Telehealth"

/**
 * Core appointment entity
 */
export interface Appointment {
  id: string
  rbtId: string
  clientId: string
  serviceId: string
  bcbaId?: string
  location: AppointmentLocation
  startsAt: string                 // ISO 8601 datetime
  endsAt: string                   // ISO 8601 datetime
  status: AppointmentStatus
  notes?: string
  createdAt?: string
  updatedAt?: string

  // Phase 1 — new optional fields (backward compatible)
  eventType?: EventType
  placeOfServiceAddressId?: string
  clientAddressId?: string
  billingCodeId?: string
  billingCodeIds?: string[]
  billingCodeName?: string
  clientName?: string
  addressLabel?: string
  providerName?: string
  priorAuthorizationId?: string
  priorAuthorizationNumber?: string
  units?: number
  cantUnit?: number
  date?: string
  timeInit?: string
  timeEnd?: string
  addSupervision?: boolean
  supervision?: AppointmentSupervisionApiPayload
  supervisionRbtId?: string
  supervisionBillingCodeIds?: string[]
  requiresCaregiverSignature?: boolean
}

/**
 * DTO for creating a new appointment
 */
export interface CreateAppointmentDto {
  rbtId: string
  clientId: string
  serviceId: string
  bcbaId?: string
  location: AppointmentLocation
  startsAt: string
  endsAt: string
  notes?: string
}

/**
 * DTO for updating an existing appointment
 */
export interface UpdateAppointmentDto {
  clientId?: string
  serviceId?: string
  bcbaId?: string
  location?: AppointmentLocation
  startsAt?: string
  endsAt?: string
  status?: AppointmentStatus
  notes?: string
}

/**
 * Service/therapy type that can be scheduled
 */
export interface ScheduleService {
  id: string
  name: string
  code: string
  durationMin: number
  color: string
  description?: string
}

/**
 * Client entity (simplified for scheduling context)
 */
export interface ScheduleClient {
  id: string
  fullName: string
  code: string
  dateOfBirth?: string
  guardianName?: string
  guardianPhone?: string
  address?: string
  insuranceId?: string
  active: boolean
}

/**
 * User entity for RBTs and BCBAs (simplified for scheduling context)
 */
export interface ScheduleUser {
  id: string
  fullName: string
  email: string
  role: "RBT" | "BCBA" | "Admin"
  avatar?: string
  active: boolean
}

/**
 * Position data for rendering appointments in the calendar grid
 */
export interface AppointmentPosition {
  dayIndex: number
  top: number
  height: number
}

/**
 * Filters for querying appointments
 */
export interface AppointmentFilters {
  rbtId?: string
  clientId?: string
  status?: AppointmentStatus | "all"
  location?: AppointmentLocation | "all"
  dateFrom?: string
  dateTo?: string
  searchQuery?: string
}

/**
 * Form data for the appointment creation/edit modal
 */
export interface AppointmentFormData {
  eventType: EventType
  clientId: string
  placeOfServiceAddressId: string
  date: string
  startTime: string
  endTime: string
  billingCodeId: string
  priorAuthorizationId: string
  approvedPriorAuthorizationBillingCodeId: string
  validatedUnits: number | null
  addSupervision: boolean
  supervision: {
    title: string
    providerId: string
    billingCodeId: string
    date: string
    startTime: string
    endTime: string
    priorAuthorizationId: string
    approvedPriorAuthorizationBillingCodeId: string
    validatedUnits: number | null
  }
  /** @deprecated kept for calendar store compat when loading existing rows */
  billingCodeIds?: string[]
  supervisionRbtId?: string
  supervisionBillingCodeIds?: string[]
  requiresCaregiverSignature?: boolean
  notes?: string
}

/**
 * Modal defaults when opening the appointment modal
 */
export interface AppointmentModalDefaults {
  date?: string
  time?: string
}

/**
 * Context menu position and state
 */
export interface ContextMenuState {
  x: number
  y: number
  appointmentId: string
}

/**
 * Mock billing code item for scheduling context
 */
export interface ScheduleBillingCode {
  id: string
  type: string                     // "CPT"
  code: string                     // "97153"
  modifier?: string                // "XP", "TS"
  description: string
  label: string                    // Formatted display: "CPT 97153 (XP)"
}
