"use client"

import { useCallback, useEffect, useState } from "react"
import { serviceGet } from "@/lib/services/baseService"

interface UseHasActiveServiceReturn {
  hasActiveService: boolean | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useHasActiveService(): UseHasActiveServiceReturn {
  const [hasActiveService, setHasActiveService] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await serviceGet<boolean>("/company/has-service")
      if (response.status === 200 || response.status === 201) {
        setHasActiveService(Boolean(response.data))
      } else {
        setHasActiveService(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to check service status"))
      setHasActiveService(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  return { hasActiveService, isLoading, error, refetch: fetchStatus }
}
