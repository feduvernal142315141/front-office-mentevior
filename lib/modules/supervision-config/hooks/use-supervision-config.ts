"use client"

import { useState, useEffect, useCallback } from "react"
import type { SupervisionConfig } from "@/lib/types/supervision-config.types"
import { getSupervisionConfig } from "../services/supervision-config.service"

interface UseSupervisionConfigReturn {
  config: SupervisionConfig | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useSupervisionConfig(): UseSupervisionConfigReturn {
  const [config, setConfig] = useState<SupervisionConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getSupervisionConfig()
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch supervision configuration"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  return { config, isLoading, error, refetch: fetchConfig }
}
