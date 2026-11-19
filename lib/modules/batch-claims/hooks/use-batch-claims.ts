"use client"

import { useCallback, useEffect, useState } from "react"
import type { BatchClaimSummary } from "@/lib/types/batch-claim.types"
import type { ClaimMdEffectiveStatus } from "@/lib/types/claim-md.types"
import { buildBatchClaimsFilters, type BatchClaimsFilters } from "../filters"
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
  claimMdEffectiveStatuses?: readonly ClaimMdEffectiveStatus[],
  filters: BatchClaimsFilters = {},
): UseBatchClaimsReturn {
  const { payerId, payerPlanId, createdFrom, createdTo } = filters
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
        const { entities, pagination } = await getBatchClaims({
          filters: buildBatchClaimsFilters(search, { payerId, payerPlanId, createdFrom, createdTo }),
          page,
          pageSize,
          claimMdEffectiveStatuses,
        })
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
  }, [search, page, pageSize, claimMdEffectiveStatuses, payerId, payerPlanId, createdFrom, createdTo, refreshIndex])

  const refetch = useCallback(async () => {
    setRefreshIndex((i) => i + 1)
  }, [])

  return { batchClaims, totalCount, isLoading, error, refetch }
}
