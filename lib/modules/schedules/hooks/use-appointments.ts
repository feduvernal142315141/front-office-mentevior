"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Appointment } from "@/lib/types/appointment.types"
import { getAppointments } from "../services/appointments.service"

interface UseScheduleAppointmentsProps {
  filters?: string[]
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
 * Fetches appointments via GET /appointment with filters[] + dateFrom/dateTo.
 * Uses a serialized key to prevent infinite loops from object reference changes.
 */
export function useScheduleAppointments({
  filters,
  providerId,
  dateFrom,
  dateTo,
}: UseScheduleAppointmentsProps): UseScheduleAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Serialize filters to a stable string key to avoid re-render loops
  const filtersKey = filters ? filters.join("|") : ""
  const optsRef = useRef({ filters, providerId, dateFrom, dateTo })
  optsRef.current = { filters, providerId, dateFrom, dateTo }

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointments(optsRef.current)
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch appointments"))
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, providerId, dateFrom, dateTo])

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
