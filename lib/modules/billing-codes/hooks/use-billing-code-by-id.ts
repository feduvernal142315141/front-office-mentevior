"use client"

import { useState, useEffect } from "react"
import type { BillingCode } from "@/lib/types/billing-code.types"
import { getBillingCodeById } from "../services/billing-codes.service"

interface UseBillingCodeByIdReturn {
  billingCode: BillingCode | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useBillingCodeById(billingCodeId: string | null): UseBillingCodeByIdReturn {
  const [billingCode, setBillingCode] = useState<BillingCode | null>(null)
  const [isLoading, setIsLoading] = useState(!!billingCodeId)
  const [error, setError] = useState<Error | null>(null)

  const fetchBillingCode = async () => {
    if (!billingCodeId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getBillingCodeById(billingCodeId)
      setBillingCode(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch billing code")
      setError(errorObj)
      console.error("Error fetching billing code:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingCodeId])

  return {
    billingCode,
    isLoading,
    error,
    refetch: fetchBillingCode,
  }
}
