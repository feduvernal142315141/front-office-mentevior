"use client"

import { useCallback, useEffect, useState } from "react"
import type { Caregiver } from "@/lib/types/caregiver.types"
import { getCaregiversByClientId } from "../services/caregivers.service"

interface UseCaregiversByClientReturn {
  caregivers: Caregiver[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCaregiversByClient(clientId: string | null): UseCaregiversByClientReturn {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCaregivers = useCallback(async () => {
    if (!clientId) {
      setCaregivers([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getCaregiversByClientId(clientId)
      setCaregivers(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch caregivers")
      setError(errorObj)
      setCaregivers([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchCaregivers()
  }, [fetchCaregivers])

  return {
    caregivers,
    isLoading,
    error,
    refetch: fetchCaregivers,
  }
}
