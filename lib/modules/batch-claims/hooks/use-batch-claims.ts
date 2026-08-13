"use client"

import { useCallback, useEffect, useState } from "react"
import type { BatchClaimSummary } from "@/lib/types/batch-claim.types"
import { buildFilters } from "@/lib/utils/query-filters"
import { getBatchClaims } from "../services/batch-claims.service"

interface UseBatchClaimsReturn {
  batchClaims: BatchClaimSummary[]
  totalCount: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBatchClaims(
  search: string,
  page: number,
  pageSize: number,
): UseBatchClaimsReturn {
  const [batchClaims, setBatchClaims] = useState<BatchClaimSummary[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let isActive = true

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const trimmed = search.trim()
        const filters = trimmed
          ? buildFilters([], { fields: ["reference"], search: trimmed })
          : undefined
        const { entities, pagination } = await getBatchClaims({ filters, page, pageSize })
        if (isActive) {
          setBatchClaims(entities)
          setTotalCount(pagination.total)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to fetch batch claims")
          setBatchClaims([])
          setTotalCount(0)
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [search, page, pageSize, refreshIndex])

  const refetch = useCallback(async () => {
    setRefreshIndex((i) => i + 1)
  }, [])

  return { batchClaims, totalCount, isLoading, error, refetch }
}
