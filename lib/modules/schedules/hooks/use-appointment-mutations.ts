"use client"

import { useState, useCallback } from "react"
import { toast } from "@/lib/compat/sonner"
import type { AppointmentApiPayload } from "@/lib/types/appointment.types"
import {
  createAppointment as createAppointmentService,
  updateAppointmentApi,
  deleteAppointmentService,
} from "../services/appointments.service"

interface UseAppointmentMutationsReturn {
  create: (payload: AppointmentApiPayload) => Promise<string | null>
  update: (payload: AppointmentApiPayload & { id: string }) => Promise<string | null>
  remove: (id: string) => Promise<boolean>
  isLoading: boolean
}

export function useAppointmentMutations(): UseAppointmentMutationsReturn {
  const [isLoading, setIsLoading] = useState(false)

  const create = useCallback(async (payload: AppointmentApiPayload) => {
    try {
      setIsLoading(true)
      const id = await createAppointmentService(payload)
      toast.success("Appointment created successfully")
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create appointment"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const update = useCallback(async (payload: AppointmentApiPayload & { id: string }) => {
    try {
      setIsLoading(true)
      const id = await updateAppointmentApi(payload)
      toast.success("Appointment updated successfully")
      return id
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

  return { create, update, remove, isLoading }
}
