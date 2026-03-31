"use client"

import { useCallback, useEffect, useState } from "react"
import type { PriorAuthorization } from "@/lib/types/prior-authorization.types"
import { getPriorAuthorizationsByClientId } from "../services/prior-authorizations.service"

interface UsePriorAuthorizationsByClientReturn {
  pas: PriorAuthorization[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function usePriorAuthorizationsByClient(
  clientId: string | null
): UsePriorAuthorizationsByClientReturn {
  const [pas, setPas] = useState<PriorAuthorization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPAs = useCallback(async () => {
    if (!clientId) {
      setPas([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getPriorAuthorizationsByClientId(clientId)
      setPas(data)
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error("Failed to fetch prior authorizations")
      setError(errorObj)
      setPas([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchPAs()
  }, [fetchPAs])

  return {
    pas,
    isLoading,
    error,
    refetch: fetchPAs,
  }
}
