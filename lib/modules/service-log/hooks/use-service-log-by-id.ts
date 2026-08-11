"use client"

import { useCallback, useEffect, useState } from "react"
import type { ServiceLogDetail } from "@/lib/types/service-log.types"
import { getServiceLogById } from "../services/service-log.service"

interface UseServiceLogByIdReturn {
  serviceLog: ServiceLogDetail | null
  isLoading: boolean
  /** `true` cuando el backend respondió 404: el service log no existe */
  notFound: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useServiceLogById(id?: string): UseServiceLogByIdReturn {
  const [serviceLog, setServiceLog] = useState<ServiceLogDetail | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchServiceLog = useCallback(async () => {
    if (!id) {
      setServiceLog(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setNotFound(false)

      const data = await getServiceLogById(id)
      setServiceLog(data)
      // Un 404 no es un error de red: merece su propia pantalla.
      setNotFound(data === null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load service log"))
      setServiceLog(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchServiceLog()
  }, [fetchServiceLog])

  return { serviceLog, isLoading, notFound, error, refetch: fetchServiceLog }
}
