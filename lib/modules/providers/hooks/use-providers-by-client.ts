"use client"

import { useCallback, useEffect, useState } from "react"
import type { ClientProvider } from "@/lib/types/provider.types"
import { getProvidersByClientId } from "../services/providers.service"

interface UseProvidersByClientReturn {
  providers: ClientProvider[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProvidersByClient(clientId: string | null): UseProvidersByClientReturn {
  const [providers, setProviders] = useState<ClientProvider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProviders = useCallback(async () => {
    if (!clientId) {
      setProviders([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getProvidersByClientId(clientId)
      setProviders(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch providers")
      setError(errorObj)
      setProviders([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchProviders()
  }, [fetchProviders])

  return {
    providers,
    isLoading,
    error,
    refetch: fetchProviders,
  }
}
