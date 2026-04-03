"use client"

import { useState, useEffect, useCallback } from "react"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { getAvailableBillingCodesForRate } from "../services/billing-codes.service"

interface UseAvailableBillingCodesForRateReturn {
  billingCodes: BillingCodeListItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface UseAvailableBillingCodesForRateOptions {
  autoFetch?: boolean
}

export function useAvailableBillingCodesForRate(
  payerId: string | undefined,
  options?: UseAvailableBillingCodesForRateOptions
): UseAvailableBillingCodesForRateReturn {
  const autoFetch = options?.autoFetch ?? true
  const [billingCodes, setBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!payerId) {
      setBillingCodes([])
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAvailableBillingCodesForRate(payerId)
      setBillingCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch available billing codes"))
      setBillingCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [payerId])

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
