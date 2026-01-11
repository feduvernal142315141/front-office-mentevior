"use client"

import { useState, useEffect, useCallback } from "react"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getBillingCodes } from "../services/billing-codes.service"

interface UseBillingCodesParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseBillingCodesReturn {
  billingCodes: BillingCodeListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (params?: UseBillingCodesParams) => Promise<void>
}

export function useBillingCodes(initialParams?: UseBillingCodesParams): UseBillingCodesReturn {
  const [billingCodes, setBillingCodes] = useState<BillingCodeListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBillingCodes = useCallback(async (params?: UseBillingCodesParams) => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getBillingCodes(query)
      setBillingCodes(data.billingCodes)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch billing codes"))
      setBillingCodes([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBillingCodes(initialParams)
  }, []) 

  return {
    billingCodes,
    totalCount,
    isLoading,
    error,
    refetch: fetchBillingCodes,
  }
}
