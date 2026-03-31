"use client"

import { useCallback, useEffect, useState } from "react"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import { getClientInsurancesByClientId } from "../services/client-insurances.service"

interface UseClientInsurancesByClientReturn {
  insurances: ClientInsurance[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClientInsurancesByClient(
  clientId: string | null
): UseClientInsurancesByClientReturn {
  const [insurances, setInsurances] = useState<ClientInsurance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchInsurances = useCallback(async () => {
    if (!clientId) {
      setInsurances([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getClientInsurancesByClientId(clientId)
      setInsurances(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch insurances")
      setError(errorObj)
      setInsurances([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchInsurances()
  }, [fetchInsurances])

  return {
    insurances,
    isLoading,
    error,
    refetch: fetchInsurances,
  }
}
