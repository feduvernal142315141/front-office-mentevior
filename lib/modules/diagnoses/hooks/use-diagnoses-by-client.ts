"use client"

import { useCallback, useEffect, useState } from "react"
import type { Diagnosis } from "@/lib/types/diagnosis.types"
import { getDiagnosesByClientId } from "../services/diagnoses.service"

interface UseDiagnosesByClientReturn {
  diagnoses: Diagnosis[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDiagnosesByClient(clientId: string | null): UseDiagnosesByClientReturn {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchDiagnoses = useCallback(async () => {
    if (!clientId) {
      setDiagnoses([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getDiagnosesByClientId(clientId)
      setDiagnoses(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch diagnoses")
      setError(errorObj)
      setDiagnoses([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchDiagnoses()
  }, [fetchDiagnoses])

  return {
    diagnoses,
    isLoading,
    error,
    refetch: fetchDiagnoses,
  }
}
