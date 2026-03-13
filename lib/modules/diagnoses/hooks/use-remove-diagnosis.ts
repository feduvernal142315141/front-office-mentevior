"use client"

import { useState } from "react"
import { toast } from "sonner"
import { removeDiagnosis } from "../services/diagnoses.service"

interface UseRemoveDiagnosisReturn {
  remove: (diagnosisId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useRemoveDiagnosis(): UseRemoveDiagnosisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (diagnosisId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await removeDiagnosis(diagnosisId)
      toast.success("Diagnosis removed successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove diagnosis"
      setError(message)
      toast.error("Error removing diagnosis", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
