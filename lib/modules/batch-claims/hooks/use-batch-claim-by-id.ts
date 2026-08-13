"use client"

import { useCallback, useEffect, useState } from "react"
import type { BatchClaim } from "@/lib/types/batch-claim.types"
import { getBatchClaimById } from "../services/batch-claims.service"

interface UseBatchClaimByIdReturn {
  batchClaim: BatchClaim | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useBatchClaimById(batchClaimId: string | null): UseBatchClaimByIdReturn {
  const [batchClaim, setBatchClaim] = useState<BatchClaim | null>(null)
  const [isLoading, setIsLoading] = useState(!!batchClaimId)
  const [error, setError] = useState<Error | null>(null)

  const fetchBatchClaim = useCallback(async () => {
    if (!batchClaimId) {
      setBatchClaim(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setBatchClaim(await getBatchClaimById(batchClaimId))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch batch claim"))
      setBatchClaim(null)
    } finally {
      setIsLoading(false)
    }
  }, [batchClaimId])

  useEffect(() => {
    void fetchBatchClaim()
  }, [fetchBatchClaim])

  return { batchClaim, isLoading, error, refetch: fetchBatchClaim }
}
