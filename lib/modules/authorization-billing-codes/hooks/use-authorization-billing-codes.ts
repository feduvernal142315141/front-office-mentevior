"use client"

import { useCallback, useEffect, useState } from "react"
import type { PriorAuthBillingCode } from "@/lib/types/prior-authorization.types"
import { getAuthorizationBillingCodesByPriorAuthId } from "../services/authorization-billing-codes-api.service"

interface UseAuthorizationBillingCodesReturn {
  billingCodes: PriorAuthBillingCode[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAuthorizationBillingCodes(
  priorAuthorizationId: string | null | undefined
): UseAuthorizationBillingCodesReturn {
  const [billingCodes, setBillingCodes] = useState<PriorAuthBillingCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCodes = useCallback(async () => {
    if (!priorAuthorizationId) {
      setBillingCodes([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getAuthorizationBillingCodesByPriorAuthId(priorAuthorizationId)
      setBillingCodes(data)
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error("Failed to fetch authorization billing codes")
      setError(errorObj)
      setBillingCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [priorAuthorizationId])

  useEffect(() => {
    void fetchCodes()
  }, [fetchCodes])

  return { billingCodes, isLoading, error, refetch: fetchCodes }
}
