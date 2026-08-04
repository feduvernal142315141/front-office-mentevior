"use client"

import { useCallback, useEffect, useState } from "react"
import type { DashboardScope, DashboardSummary } from "@/lib/types/dashboard.types"
import { fetchDashboardSummary } from "../services/dashboard.source"

interface UseDashboardSummaryReturn {
  summary: DashboardSummary | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Firma idéntica con mock y con backend real: los widgets se escriben una vez.
 */
export function useDashboardSummary(scope: DashboardScope = "company"): UseDashboardSummaryReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSummary(await fetchDashboardSummary(scope))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load dashboard"))
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [scope])

  useEffect(() => {
    void load()
  }, [load])

  return { summary, isLoading, error, refetch: load }
}
