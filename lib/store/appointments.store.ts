import { create } from "zustand"
import type { 
  Appointment, 
  AppointmentStatus,
  UpdateAppointmentDto 
} from "@/lib/types/appointment.types"
import { MOCK_APPOINTMENTS } from "@/lib/modules/schedules/mocks"
import { parseISO, areIntervalsOverlapping } from "date-fns"

// ============================================
// STORE INTERFACE
// ============================================

interface AppointmentsState {
  // Data
  appointments: Appointment[]
  selectedAppointment: Appointment | null
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  setAppointments: (appointments: Appointment[]) => void
  setSelectedAppointment: (appointment: Appointment | null) => void
  
  // CRUD operations
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, data: Partial<UpdateAppointmentDto>) => void
  deleteAppointment: (id: string) => void
  
  // Status helpers
  updateStatus: (id: string, status: AppointmentStatus) => void
  
  // Conflict detection
  checkConflict: (
    rbtId: string, 
    startsAt: string, 
    endsAt: string, 
    excludeId?: string
  ) => boolean
  
  // Filters
  getAppointmentsByRbt: (rbtId: string) => Appointment[]
  getAppointmentsByClient: (clientId: string) => Appointment[]
  getAppointmentsByDateRange: (startDate: string, endDate: string) => Appointment[]
}

// ============================================
// ZUSTAND STORE
// ============================================

export const useAppointments = create<AppointmentsState>((set, get) => ({
  // Initial state - load from mocks
  appointments: MOCK_APPOINTMENTS,
  selectedAppointment: null,
  isLoading: false,
  error: null,
  
  // Setters
  setAppointments: (appointments) => set({ appointments }),
  setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),
  
  // ============================================
  // CRUD OPERATIONS
  // ============================================
  
  addAppointment: (appointment) => {
    set((state) => ({
      appointments: [...state.appointments, appointment],
    }))
  },
  
  updateAppointment: (id, data) => {
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, ...data, updatedAt: new Date().toISOString() } : apt
      ),
      // Also update selected appointment if it's the same one
      selectedAppointment: 
        state.selectedAppointment?.id === id 
          ? { ...state.selectedAppointment, ...data } 
          : state.selectedAppointment,
    }))
  },
  
  deleteAppointment: (id) => {
    set((state) => ({
      appointments: state.appointments.filter((apt) => apt.id !== id),
      selectedAppointment: 
        state.selectedAppointment?.id === id 
          ? null 
          : state.selectedAppointment,
    }))
  },
  
  // ============================================
  // STATUS HELPERS
  // ============================================
  
  updateStatus: (id, status) => {
    get().updateAppointment(id, { status })
  },
  
  // ============================================
  // CONFLICT DETECTION
  // ============================================
  
  checkConflict: (rbtId, startsAt, endsAt, excludeId) => {
    const { appointments } = get()
    
    const newInterval = {
      start: parseISO(startsAt),
      end: parseISO(endsAt),
    }
    
    return appointments.some((apt) => {
      // Skip if it's the same appointment (for updates)
      if (excludeId && apt.id === excludeId) return false
      
      // Skip if different RBT
      if (apt.rbtId !== rbtId) return false
      
      // Skip cancelled appointments
      if (apt.status === "Cancelled") return false
      
      const existingInterval = {
        start: parseISO(apt.startsAt),
        end: parseISO(apt.endsAt),
      }
      
      return areIntervalsOverlapping(newInterval, existingInterval)
    })
  },
  
  // ============================================
  // FILTERS
  // ============================================
  
  getAppointmentsByRbt: (rbtId) => {
    return get().appointments.filter((apt) => apt.rbtId === rbtId)
  },
  
  getAppointmentsByClient: (clientId) => {
    return get().appointments.filter((apt) => apt.clientId === clientId)
  },
  
  getAppointmentsByDateRange: (startDate, endDate) => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    
    return get().appointments.filter((apt) => {
      const aptStart = parseISO(apt.startsAt)
      return aptStart >= start && aptStart <= end
    })
  },
}))

// ============================================
// SELECTORS (for optimized re-renders)
// ============================================

export const selectAppointments = (state: AppointmentsState) => state.appointments
export const selectSelectedAppointment = (state: AppointmentsState) => state.selectedAppointment
export const selectIsLoading = (state: AppointmentsState) => state.isLoading
