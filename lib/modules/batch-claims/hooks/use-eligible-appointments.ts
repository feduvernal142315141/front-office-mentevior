"use client"

import { useCallback, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { EligibleAppointment, EligibleAppointmentsQuery } from "@/lib/types/batch-claim.types"
import { getEligibleAppointments } from "../services/batch-claims.service"

interface UseEligibleAppointmentsReturn {
  appointments: EligibleAppointment[]
  isLoading: boolean
  hasSearched: boolean
  search: (query: EligibleAppointmentsQuery) => Promise<EligibleAppointment[] | null>
  reset: () => void
}

/**
 * Fetch-on-demand (not on-mount): the picker only queries once the user has a
 * payer plan and a date range selected.
 */
export function useEligibleAppointments(): UseEligibleAppointmentsReturn {
  const [appointments, setAppointments] = useState<EligibleAppointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (query: EligibleAppointmentsQuery) => {
    setIsLoading(true)
    try {
      const result = await getEligibleAppointments(query)
      setAppointments(result)
      setHasSearched(true)
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch eligible appointments")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setAppointments([])
    setHasSearched(false)
  }, [])

  return { appointments, isLoading, hasSearched, search, reset }
}
