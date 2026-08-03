"use client"

import { useCallback, useEffect, useState } from "react"
import type { ClinicalMonthlyDetail } from "@/lib/types/clinical-monthly.types"
import { getClinicalMonthlyById } from "../services/clinical-monthly.service"

interface UseClinicalMonthlyByIdReturn {
  clinicalMonthly: ClinicalMonthlyDetail | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClinicalMonthlyById(id?: string | null): UseClinicalMonthlyByIdReturn {
  const [clinicalMonthly, setClinicalMonthly] = useState<ClinicalMonthlyDetail | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)
  const [error, setError] = useState<Error | null>(null)

  const fetchClinicalMonthly = useCallback(async () => {
    if (!id) {
      setClinicalMonthly(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setClinicalMonthly(await getClinicalMonthlyById(id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch clinical monthly"))
      setClinicalMonthly(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchClinicalMonthly()
  }, [fetchClinicalMonthly])

  return { clinicalMonthly, isLoading, error, refetch: fetchClinicalMonthly }
}
