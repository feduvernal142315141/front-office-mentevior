"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { getAppointmentsByClient } from "@/lib/modules/schedules/services/appointments.service"
import type { Appointment } from "@/lib/types/appointment.types"

interface UseClientAppointmentsParams {
  clientId: string
  dateFrom: string // YYYY-MM-DD
  dateTo: string   // YYYY-MM-DD
}

interface UseClientAppointmentsResult {
  appointments: Appointment[]
  /** Map of date (YYYY-MM-DD) → Appointment for quick lookup */
  appointmentsByDate: Map<string, Appointment>
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useClientAppointments(
  params: UseClientAppointmentsParams,
): UseClientAppointmentsResult {
  const { clientId, dateFrom, dateTo } = params
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!clientId || !dateFrom || !dateTo) {
      setAppointments([])
      return
    }

    setIsLoading(true)
    try {
      const data = await getAppointmentsByClient(clientId, dateFrom, dateTo)
      setAppointments(data)
    } catch {
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId, dateFrom, dateTo])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const appointmentsByDate = useMemo((): Map<string, Appointment> => {
    const map = new Map<string, Appointment>()
    for (const apt of appointments) {
      const date = apt.date ?? apt.startsAt?.slice(0, 10)
      if (!date) continue
      map.set(date, apt)
    }
    return map
  }, [appointments])

  return {
    appointments,
    appointmentsByDate,
    isLoading,
    refetch: fetchData,
  }
}
