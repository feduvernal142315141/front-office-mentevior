"use client"

import { useCallback, useEffect, useState } from "react"
import { getInsurancePlanForPayer } from "@/lib/modules/payers/services/insurance-plan.service"
import type { InsurancePlanDetailDto } from "@/lib/types/insurance-plan-rate.types"

interface UseInsurancePlansByPayerReturn {
  plan: InsurancePlanDetailDto | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useInsurancePlansByPayer(payerId: string | null): UseInsurancePlansByPayerReturn {
  const [plan, setPlan] = useState<InsurancePlanDetailDto | null>(null)
  const [isLoading, setIsLoading] = useState(!!payerId)
  const [error, setError] = useState<Error | null>(null)

  const fetchPlan = useCallback(async () => {
    if (!payerId) {
      setPlan(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getInsurancePlanForPayer(payerId)
      setPlan(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch insurance plan")
      setError(errorObj)
      setPlan(null)
    } finally {
      setIsLoading(false)
    }
  }, [payerId])

  useEffect(() => {
    void fetchPlan()
  }, [fetchPlan])

  return {
    plan,
    isLoading,
    error,
    refetch: fetchPlan,
  }
}
