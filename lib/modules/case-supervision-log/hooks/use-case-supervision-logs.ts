"use client"

import { useCallback, useEffect, useState } from "react"
import type { QueryModel } from "@/lib/models/queryModel"
import type { CaseSupervisionLogListItem } from "@/lib/types/case-supervision-log.types"
import { getCaseSupervisionLogs } from "../services/case-supervision-log.service"

interface UseCaseSupervisionLogsParams {
  page?: number
  pageSize?: number
  filters?: string[]
  orders?: string[]
  /** Permite montar el hook sin disparar la request todavía */
  enabled?: boolean
}

interface UseCaseSupervisionLogsReturn {
  items: CaseSupervisionLogListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCaseSupervisionLogs(
  params?: UseCaseSupervisionLogsParams,
): UseCaseSupervisionLogsReturn {
  const [items, setItems] = useState<CaseSupervisionLogListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Los arrays cambian de identidad en cada render: se comparan por contenido
  const filtersKey = params?.filters?.join("|") ?? ""
  const ordersKey = params?.orders?.join("|") ?? ""
  const page = params?.page ?? 0
  const pageSize = params?.pageSize ?? 10
  const enabled = params?.enabled ?? true

  const fetchItems = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const query: QueryModel = {
        page,
        pageSize,
        filters: filtersKey ? filtersKey.split("|") : undefined,
        orders: ordersKey ? ordersKey.split("|") : undefined,
      }

      const data = await getCaseSupervisionLogs(query)
      setItems(data.items)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch case supervision logs"))
      setItems([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, page, pageSize, filtersKey, ordersKey])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  return { items, totalCount, isLoading, error, refetch: fetchItems }
}
