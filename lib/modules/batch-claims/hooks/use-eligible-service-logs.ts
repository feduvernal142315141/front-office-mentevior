"use client"

import { useCallback, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { EligibleServiceLog, EligibleServiceLogsQuery } from "@/lib/types/batch-claim.types"
import { getEligibleServiceLogs } from "../services/batch-claims.service"

interface UseEligibleServiceLogsReturn {
  serviceLogs: EligibleServiceLog[]
  isLoading: boolean
  hasSearched: boolean
  search: (query: EligibleServiceLogsQuery) => Promise<EligibleServiceLog[] | null>
  reset: () => void
}

/**
 * Fetch-on-demand (not on-mount): the picker only queries once the user has a
 * payer plan and a service period selected.
 */
export function useEligibleServiceLogs(): UseEligibleServiceLogsReturn {
  const [serviceLogs, setServiceLogs] = useState<EligibleServiceLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(async (query: EligibleServiceLogsQuery) => {
    setIsLoading(true)
    try {
      const result = await getEligibleServiceLogs(query)
      setServiceLogs(result)
      setHasSearched(true)
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch eligible service logs")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setServiceLogs([])
    setHasSearched(false)
  }, [])

  return { serviceLogs, isLoading, hasSearched, search, reset }
}
