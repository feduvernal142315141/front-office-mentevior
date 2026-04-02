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

export function useAvailableBillingCodesForRate(): UseAvailableBillingCodesForRateReturn {
  const [billingCodes, setBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAvailableBillingCodesForRate()
      setBillingCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch available billing codes"))
      setBillingCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return {
    billingCodes,
    isLoading,
    error,
    refetch: fetch,
  }
}
