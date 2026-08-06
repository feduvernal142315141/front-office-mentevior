"use client"

import { useCallback, useEffect, useState } from "react"
import type { QueryModel } from "@/lib/models/queryModel"
import type { MonthlySupervisionListItem } from "@/lib/types/monthly-supervision.types"
import { getMonthlySupervisions } from "../services/monthly-supervision.service"

interface UseMonthlySupervisionsParams {
  page?: number
  pageSize?: number
  filters?: string[]
  orders?: string[]
}

interface UseMonthlySupervisionsReturn {
  items: MonthlySupervisionListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useMonthlySupervisions(
  params?: UseMonthlySupervisionsParams,
): UseMonthlySupervisionsReturn {
  const [items, setItems] = useState<MonthlySupervisionListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Los arrays cambian de identidad en cada render: se comparan por contenido
  const filtersKey = params?.filters?.join("|") ?? ""
  const ordersKey = params?.orders?.join("|") ?? ""
  const page = params?.page ?? 0
  const pageSize = params?.pageSize ?? 10

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const query: QueryModel = {
        page,
        pageSize,
        filters: filtersKey ? filtersKey.split("|") : undefined,
        orders: ordersKey ? ordersKey.split("|") : undefined,
      }

      const data = await getMonthlySupervisions(query)
      setItems(data.items)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch monthly supervisions"))
      setItems([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, filtersKey, ordersKey])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  return { items, totalCount, isLoading, error, refetch: fetchItems }
}
