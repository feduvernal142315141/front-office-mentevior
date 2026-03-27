"use client"

import { useCallback, useEffect, useState } from "react"
import { getRatesByPayerId } from "@/lib/modules/payers/services/insurance-plan.service"
import type { InsurancePlanRateRow } from "@/lib/types/insurance-plan-rate.types"

interface UseRatesByPayerIdReturn {
  rates: InsurancePlanRateRow[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRatesByPayerId(payerId: string | null): UseRatesByPayerIdReturn {
  const [rates, setRates] = useState<InsurancePlanRateRow[]>([])
  const [isLoading, setIsLoading] = useState(!!payerId)
  const [error, setError] = useState<Error | null>(null)

  const fetchRates = useCallback(async () => {
    if (!payerId) {
      setRates([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getRatesByPayerId(payerId)
      setRates(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch rates")
      setError(errorObj)
      setRates([])
    } finally {
      setIsLoading(false)
    }
  }, [payerId])

  useEffect(() => {
    void fetchRates()
  }, [fetchRates])

  return {
    rates,
    isLoading,
    error,
    refetch: fetchRates,
  }
}
