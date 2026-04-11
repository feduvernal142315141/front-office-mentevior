"use client"

import { useState, useEffect, useCallback } from "react"
import type { ServicePlanConfig } from "@/lib/types/service-plan-config.types"
import { getServicePlanConfig } from "../services/service-plan-config.service"

interface UseServicePlanConfigReturn {
  config: ServicePlanConfig | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useServicePlanConfig(): UseServicePlanConfigReturn {
  const [config, setConfig] = useState<ServicePlanConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getServicePlanConfig()
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch service plan configuration"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  return { config, isLoading, error, refetch: fetchConfig }
}
