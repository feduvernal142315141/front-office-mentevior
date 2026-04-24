"use client"

import { useCallback, useEffect, useState } from "react"
import { getCompanyServicePlans } from "../services/company-service-plans.service"
import type { CompanyServicePlan } from "@/lib/types/company-service-plan.types"

interface UseCompanyServicePlansReturn {
  servicePlans: CompanyServicePlan[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCompanyServicePlans(): UseCompanyServicePlansReturn {
  const [servicePlans, setServicePlans] = useState<CompanyServicePlan[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchServicePlans = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getCompanyServicePlans()
      setServicePlans(data.servicePlans)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch service plans"))
      setServicePlans([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchServicePlans()
  }, [fetchServicePlans])

  return {
    servicePlans,
    totalCount,
    isLoading,
    error,
    refetch: fetchServicePlans,
  }
}
