"use client"

import { useState, useEffect, useCallback } from "react"
import type { AppointmentConfig } from "@/lib/types/appointment-config.types"
import { getAppointmentConfig } from "../services/appointment-config.service"

interface UseAppointmentConfigReturn {
  config: AppointmentConfig | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAppointmentConfig(): UseAppointmentConfigReturn {
  const [config, setConfig] = useState<AppointmentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointmentConfig()
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch appointment configuration"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return { config, isLoading, error, refetch: fetchConfig }
}
