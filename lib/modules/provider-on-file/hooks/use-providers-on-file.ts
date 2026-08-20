"use client"

import { useCallback, useEffect, useState } from "react"
import type { ProviderOnFile } from "@/lib/types/provider-on-file.types"
import { getProvidersOnFile } from "../services/provider-on-file.service"

interface UseProvidersOnFileReturn {
  providers: ProviderOnFile[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Providers on file de la compañía (lista completa, para selects) */
export function useProvidersOnFile(): UseProvidersOnFileReturn {
  const [providers, setProviders] = useState<ProviderOnFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getProvidersOnFile({ page: 0, pageSize: 200 })
      setProviders(data.providers)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch providers on file"))
      setProviders([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  return { providers, isLoading, error, refetch: fetchProviders }
}
