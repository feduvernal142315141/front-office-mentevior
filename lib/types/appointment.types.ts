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
 * Location where the appointment takes place
 */
export type AppointmentLocation = 
  | "Clinic" 
  | "Home" 
  | "School"
  | "Telehealth"

/**
 * Core appointment entity
 * Represents a scheduled session between an RBT and a client
 */
export interface Appointment {
  id: string
  rbtId: string                    // RBT assigned to this appointment
  clientId: string                 // Client receiving the service
  serviceId: string                // Type of service being provided
  bcbaId?: string                  // Optional supervising BCBA
  location: AppointmentLocation
  startsAt: string                 // ISO 8601 datetime
  endsAt: string                   // ISO 8601 datetime
  status: AppointmentStatus
  notes?: string
  createdAt?: string
  updatedAt?: string
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
  code: string                     // Billing code (e.g., "97153")
  durationMin: number              // Default duration in minutes
  color: string                    // Hex color for UI display
  description?: string
}

/**
 * Client entity (simplified for scheduling context)
 */
export interface ScheduleClient {
  id: string
  fullName: string
  code: string                     // Internal client code
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
 * Form data structure for appointment modal
 */
export interface AppointmentFormData {
  clientId: string
  serviceId: string
  bcbaId: string
  location: AppointmentLocation
  date: string                     // YYYY-MM-DD
  time: string                     // HH:mm
  notes: string
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
