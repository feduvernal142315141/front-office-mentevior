"use client"

import { useCallback, useEffect, useState } from "react"
import type { Medication } from "@/lib/types/medication.types"
import { getMedicationsByClientId } from "../services/medications.service"

interface UseMedicationsByClientReturn {
  medications: Medication[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useMedicationsByClient(clientId: string | null): UseMedicationsByClientReturn {
  const [medications, setMedications] = useState<Medication[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchMedications = useCallback(async () => {
    if (!clientId) {
      setMedications([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getMedicationsByClientId(clientId)
      setMedications(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch medications")
      setError(errorObj)
      setMedications([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchMedications()
  }, [fetchMedications])

  return {
    medications,
    isLoading,
    error,
    refetch: fetchMedications,
  }
}
