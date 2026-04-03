"use client"

import { useState, useEffect, useCallback } from "react"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { getAvailableBillingCodesForAuth } from "../services/billing-codes.service"

interface UseAvailableBillingCodesForAuthReturn {
  billingCodes: BillingCodeListItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface UseAvailableBillingCodesForAuthOptions {
  autoFetch?: boolean
}

export function useAvailableBillingCodesForAuth(
  priorAuthorizationId: string | undefined,
  options?: UseAvailableBillingCodesForAuthOptions
): UseAvailableBillingCodesForAuthReturn {
  const autoFetch = options?.autoFetch ?? true
  const [billingCodes, setBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!priorAuthorizationId) return
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAvailableBillingCodesForAuth(priorAuthorizationId)
      setBillingCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch available billing codes"))
      setBillingCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [priorAuthorizationId])

  useEffect(() => {
    if (!autoFetch) return
    void fetch()
  }, [fetch, autoFetch])

  return {
    billingCodes,
    isLoading,
    error,
    refetch: fetch,
  }
}
