"use client"

import { useState, useEffect, useCallback } from "react"
import type { ClinicalMonthlyListItem } from "@/lib/types/clinical-monthly.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getClinicalMonthlies } from "../services/clinical-monthly.service"

interface UseClinicalMonthliesParams {
  page?: number
  pageSize?: number
  filters?: string[]
  orders?: string[]
}

interface UseClinicalMonthliesReturn {
  clinicalMonthlies: ClinicalMonthlyListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClinicalMonthlies(params?: UseClinicalMonthliesParams): UseClinicalMonthliesReturn {
  const [clinicalMonthlies, setClinicalMonthlies] = useState<ClinicalMonthlyListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const filtersKey = params?.filters?.join("|") ?? ""
  const ordersKey = params?.orders?.join("|") ?? ""

  const fetchClinicalMonthlies = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: filtersKey ? filtersKey.split("|") : undefined,
        orders: ordersKey ? ordersKey.split("|") : undefined,
      }
      const data = await getClinicalMonthlies(query)
      setClinicalMonthlies(data.clinicalMonthlies)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch clinical monthlies"))
      setClinicalMonthlies([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.page, params?.pageSize, filtersKey, ordersKey])

  useEffect(() => {
    fetchClinicalMonthlies()
  }, [fetchClinicalMonthlies])

  return {
    clinicalMonthlies,
    totalCount,
    isLoading,
    error,
    refetch: fetchClinicalMonthlies,
  }
}
