"use client"

import { useCallback, useEffect, useState } from "react"
import type { AppointmentNoteSummary } from "@/lib/types/appointment-note.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getAppointmentNotes } from "../services/appointment-note.service"

interface UseAppointmentNotesParams {
  filters?: string[]
  orders?: string[]
  page?: number
  pageSize?: number
}

interface UseAppointmentNotesReturn {
  notes: AppointmentNoteSummary[]
  pagination: PaginatedResponse<AppointmentNoteSummary>["pagination"]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAppointmentNotes(params?: UseAppointmentNotesParams): UseAppointmentNotesReturn {
  const [notes, setNotes] = useState<AppointmentNoteSummary[]>([])
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const filtersKey = params?.filters?.join(",") ?? ""
  const ordersKey = params?.orders?.join(",") ?? ""
  const page = params?.page ?? 0
  const pageSize = params?.pageSize ?? 10

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAppointmentNotes({
        filters: params?.filters,
        orders: params?.orders,
        page,
        pageSize,
      })
      setNotes(result.entities)
      setPagination(result.pagination)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch appointment notes")
      setError(errorObj)
      setNotes([])
    } finally {
      setIsLoading(false)
    }
  }, [filtersKey, ordersKey, page, pageSize])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { notes, pagination, isLoading, error, refetch: fetchData }
}
