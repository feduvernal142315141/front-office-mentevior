import type { Appointment } from "@/lib/types/appointment.types"
import { addDays, format, setHours, setMinutes, startOfWeek } from "date-fns"

/**
 * Generate mock appointments for the current week
 * TODO: Replace with actual API calls when backend is ready
 */
function generateMockAppointments(): Appointment[] {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  
  const appointments: Appointment[] = [
    // Monday appointments
    {
      id: "apt-001",
      rbtId: "rbt-001",
      clientId: "client-001",
      serviceId: "service-001",
      bcbaId: "bcba-001",
      location: "Clinic",
      startsAt: setMinutes(setHours(addDays(weekStart, 1), 9), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 1), 11), 0).toISOString(),
      status: "Scheduled",
      notes: "Focus on communication skills",
    },
    {
      id: "apt-002",
      rbtId: "rbt-001",
      clientId: "client-002",
      serviceId: "service-001",
      location: "Home",
      startsAt: setMinutes(setHours(addDays(weekStart, 1), 13), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 1), 15), 0).toISOString(),
      status: "Scheduled",
    },
    
    // Tuesday appointments
    {
      id: "apt-003",
      rbtId: "rbt-001",
      clientId: "client-003",
      serviceId: "service-002",
      bcbaId: "bcba-001",
      location: "Clinic",
      startsAt: setMinutes(setHours(addDays(weekStart, 2), 10), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 2), 11), 0).toISOString(),
      status: "Scheduled",
      notes: "Supervision session",
    },
    {
      id: "apt-004",
      rbtId: "rbt-001",
      clientId: "client-001",
      serviceId: "service-001",
      location: "School",
      startsAt: setMinutes(setHours(addDays(weekStart, 2), 14), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 2), 16), 0).toISOString(),
      status: "Scheduled",
    },
    
    // Wednesday appointments
    {
      id: "apt-005",
      rbtId: "rbt-001",
      clientId: "client-004",
      serviceId: "service-003",
      bcbaId: "bcba-002",
      location: "Clinic",
      startsAt: setMinutes(setHours(addDays(weekStart, 3), 9), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 3), 10), 0).toISOString(),
      status: "Scheduled",
      notes: "Parent training session",
    },
    {
      id: "apt-006",
      rbtId: "rbt-001",
      clientId: "client-005",
      serviceId: "service-001",
      location: "Home",
      startsAt: setMinutes(setHours(addDays(weekStart, 3), 11), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 3), 13), 0).toISOString(),
      status: "Completed",
    },
    {
      id: "apt-007",
      rbtId: "rbt-001",
      clientId: "client-002",
      serviceId: "service-001",
      location: "Clinic",
      startsAt: setMinutes(setHours(addDays(weekStart, 3), 15), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 3), 17), 0).toISOString(),
      status: "Scheduled",
    },
    
    // Thursday appointments
    {
      id: "apt-008",
      rbtId: "rbt-001",
      clientId: "client-006",
      serviceId: "service-004",
      bcbaId: "bcba-001",
      location: "Clinic",
      startsAt: setMinutes(setHours(addDays(weekStart, 4), 8), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 4), 11), 0).toISOString(),
      status: "Scheduled",
      notes: "Initial assessment - new client",
    },
    {
      id: "apt-009",
      rbtId: "rbt-001",
      clientId: "client-003",
      serviceId: "service-001",
      location: "Home",
      startsAt: setMinutes(setHours(addDays(weekStart, 4), 13), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 4), 15), 0).toISOString(),
      status: "InProgress",
    },
    
    // Friday appointments
    {
      id: "apt-010",
      rbtId: "rbt-001",
      clientId: "client-007",
      serviceId: "service-001",
      location: "Clinic",
      startsAt: setMinutes(setHours(addDays(weekStart, 5), 9), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 5), 11), 0).toISOString(),
      status: "Scheduled",
    },
    {
      id: "apt-011",
      rbtId: "rbt-001",
      clientId: "client-001",
      serviceId: "service-002",
      bcbaId: "bcba-003",
      location: "Telehealth",
      startsAt: setMinutes(setHours(addDays(weekStart, 5), 14), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 5), 15), 0).toISOString(),
      status: "Scheduled",
      notes: "Monthly supervision",
    },
    
    // Weekend - minimal appointments
    {
      id: "apt-012",
      rbtId: "rbt-001",
      clientId: "client-004",
      serviceId: "service-001",
      location: "Home",
      startsAt: setMinutes(setHours(addDays(weekStart, 6), 10), 0).toISOString(),
      endsAt: setMinutes(setHours(addDays(weekStart, 6), 12), 0).toISOString(),
      status: "Cancelled",
      notes: "Client requested cancellation",
    },
  ]
  
  return appointments
}

export const MOCK_APPOINTMENTS: Appointment[] = generateMockAppointments()

/**
 * Get all mock appointments
 */
export function getMockAppointments(): Appointment[] {
  return MOCK_APPOINTMENTS
}

/**
 * Get mock appointments by RBT ID
 */
export function getMockAppointmentsByRbt(rbtId: string): Appointment[] {
  return MOCK_APPOINTMENTS.filter((apt) => apt.rbtId === rbtId)
}

/**
 * Get mock appointments by client ID
 */
export function getMockAppointmentsByClient(clientId: string): Appointment[] {
  return MOCK_APPOINTMENTS.filter((apt) => apt.clientId === clientId)
}

/**
 * Get mock appointment by ID
 */
export function getMockAppointmentById(id: string): Appointment | undefined {
  return MOCK_APPOINTMENTS.find((apt) => apt.id === id)
}
