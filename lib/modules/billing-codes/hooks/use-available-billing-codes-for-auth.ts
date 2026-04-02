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

export function useAvailableBillingCodesForAuth(
  clientId: string | undefined
): UseAvailableBillingCodesForAuthReturn {
  const [billingCodes, setBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!clientId) return
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAvailableBillingCodesForAuth(clientId)
      setBillingCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch available billing codes"))
      setBillingCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

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
