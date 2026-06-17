"use client"

import { useState, useCallback } from "react"
import { toast } from "@/lib/compat/sonner"
import type { Appointment, AppointmentStatus, UpdateAppointmentDto } from "@/lib/types/appointment.types"
import {
  createAppointment as createAppointmentService,
  updateAppointment as updateAppointmentService,
  deleteAppointmentService,
  updateAppointmentStatus,
} from "../services/appointments.service"

interface UseAppointmentMutationsReturn {
  create: (payload: Parameters<typeof createAppointmentService>[0]) => Promise<Appointment | null>
  update: (id: string, payload: Partial<UpdateAppointmentDto>) => Promise<Appointment | null>
  remove: (id: string) => Promise<boolean>
  changeStatus: (id: string, status: AppointmentStatus) => Promise<Appointment | null>
  isLoading: boolean
}

/**
 * Provides mutation functions for appointments with toast notifications.
 * Each mutation calls the service layer (which tries the real API first,
 * then falls back to returning null on failure).
 */
export function useAppointmentMutations(): UseAppointmentMutationsReturn {
  const [isLoading, setIsLoading] = useState(false)

  const create = useCallback(async (payload: Parameters<typeof createAppointmentService>[0]) => {
    try {
      setIsLoading(true)
      const result = await createAppointmentService(payload)
      if (result) {
        toast.success("Appointment created successfully")
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create appointment"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const update = useCallback(async (id: string, payload: Partial<UpdateAppointmentDto>) => {
    try {
      setIsLoading(true)
      const result = await updateAppointmentService(id, payload)
      if (result) {
        toast.success("Appointment updated successfully")
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update appointment"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      const success = await deleteAppointmentService(id)
      if (success) {
        toast.success("Appointment deleted")
      }
      return success
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete appointment"
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changeStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    try {
      setIsLoading(true)
      const result = await updateAppointmentStatus(id, status)
      if (result) {
        toast.success(`Appointment marked as ${status}`)
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { create, update, remove, changeStatus, isLoading }
}
