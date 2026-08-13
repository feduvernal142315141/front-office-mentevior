"use client"

import { useCallback, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { BatchClaimPayload } from "@/lib/types/batch-claim.types"
import { createBatchClaim, updateBatchClaim } from "../services/batch-claims.service"

interface UseBatchClaimMutationReturn {
  create: (payload: BatchClaimPayload) => Promise<string | null>
  update: (batchClaimId: string, payload: BatchClaimPayload) => Promise<string | null>
  isLoading: boolean
}

export function useBatchClaimMutation(): UseBatchClaimMutationReturn {
  const [isLoading, setIsLoading] = useState(false)

  const create = useCallback(async (payload: BatchClaimPayload) => {
    setIsLoading(true)
    try {
      const id = await createBatchClaim(payload)
      toast.success("Batch claim created successfully")
      return id
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch claim")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const update = useCallback(async (batchClaimId: string, payload: BatchClaimPayload) => {
    setIsLoading(true)
    try {
      const id = await updateBatchClaim(batchClaimId, payload)
      toast.success("Batch claim updated successfully")
      return id
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update batch claim")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { create, update, isLoading }
}
