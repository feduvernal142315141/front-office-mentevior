"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ClaimMdSubmissionSummary } from "@/lib/types/claim-md.types"
import { getBatchClaimSubmissions } from "../services/claim-md.service"

interface UseBatchClaimSubmissionsReturn {
  submissions: ClaimMdSubmissionSummary[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Estado por claim de un BatchClaim. Sólo tiene sentido pedirlo cuando Claim.MD ya
 * respondió, así que se gatea con `enabled` desde la decisión de transmisión.
 */
export function useBatchClaimSubmissions(
  batchClaimId: string | null,
  enabled: boolean,
): UseBatchClaimSubmissionsReturn {
  const [submissions, setSubmissions] = useState<ClaimMdSubmissionSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!batchClaimId || !enabled) {
      setSubmissions([])
      setIsLoading(false)
      setError(null)
      return
    }

    const requestId = ++requestRef.current
    setIsLoading(true)
    setError(null)

    try {
      const data = await getBatchClaimSubmissions(batchClaimId)
      if (requestRef.current !== requestId) return
      setSubmissions(data)
    } catch (err) {
      if (requestRef.current !== requestId) return
      setError(err instanceof Error ? err : new Error("Failed to fetch the Claim.MD submissions"))
      setSubmissions([])
    } finally {
      if (requestRef.current === requestId) setIsLoading(false)
    }
  }, [batchClaimId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { submissions, isLoading, error, refetch: load }
}
