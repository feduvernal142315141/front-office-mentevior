"use client"

import { useState, useEffect, useCallback } from "react"
import type { Appointment } from "@/lib/types/appointment.types"
import { getAppointments } from "../services/appointments.service"

interface UseScheduleAppointmentsProps {
  userId?: string
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
 * Fetches appointments for a user within a date range.
 * Falls back to mock data when the API is unavailable.
 */
export function useScheduleAppointments({
  userId,
  dateFrom,
  dateTo,
}: UseScheduleAppointmentsProps): UseScheduleAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointments({ userId, dateFrom, dateTo })
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch appointments"))
    } finally {
      setIsLoading(false)
    }
  }, [userId, dateFrom, dateTo])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
  }
}
