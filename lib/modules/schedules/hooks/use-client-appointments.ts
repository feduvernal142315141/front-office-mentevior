"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { getAppointments } from "@/lib/modules/schedules/services/appointments.service"
import { buildFilters } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
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

  const filters = useMemo(() => {
    if (!clientId) return null
    return buildFilters([
      { field: "clientId", value: clientId, operator: FilterOperator.eq, type: "uuid" },
    ])
  }, [clientId])

  const fetchData = useCallback(async () => {
    if (!filters || !dateFrom || !dateTo) {
      setAppointments([])
      return
    }

    setIsLoading(true)
    try {
      const data = await getAppointments({ filters, dateFrom, dateTo })
      setAppointments(data)
    } catch {
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, dateFrom, dateTo])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const appointmentsByDate = useCallback((): Map<string, Appointment> => {
    const map = new Map<string, Appointment>()
    for (const apt of appointments) {
      const date = apt.date ?? apt.startsAt?.slice(0, 10)
      if (date) map.set(date, apt)
    }
    return map
  }, [appointments])

  return {
    appointments,
    appointmentsByDate: appointmentsByDate(),
    isLoading,
    refetch: fetchData,
  }
}
