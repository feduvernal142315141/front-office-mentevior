"use client"

import { useState, useEffect, useCallback } from "react"
import type { Appointment } from "@/lib/types/appointment.types"
import { getAppointments } from "../services/appointments.service"

interface UseScheduleAppointmentsProps {
  providerId?: string
  dateFrom?: string
  dateTo?: string
}

interface UseScheduleAppointmentsReturn {
  appointments: Appointment[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Fetches appointments for a provider within a date range via GET /appointment.
 */
export function useScheduleAppointments({
  providerId,
  dateFrom,
  dateTo,
}: UseScheduleAppointmentsProps): UseScheduleAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAppointments = useCallback(async () => {
    if (!providerId) {
      setAppointments([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointments({ providerId, dateFrom, dateTo })
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch appointments"))
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [providerId, dateFrom, dateTo])

  useEffect(() => {
    void fetchAppointments()
  }, [fetchAppointments])

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
  }
}
