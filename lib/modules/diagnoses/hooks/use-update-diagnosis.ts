"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateDiagnosisDto } from "@/lib/types/diagnosis.types"
import { updateDiagnosis } from "../services/diagnoses.service"

interface UseUpdateDiagnosisReturn {
  update: (diagnosisId: string, data: UpdateDiagnosisDto) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useUpdateDiagnosis(): UseUpdateDiagnosisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (diagnosisId: string, data: UpdateDiagnosisDto): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await updateDiagnosis(diagnosisId, data)
      toast.success("Diagnosis updated successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update diagnosis"
      setError(message)
      toast.error("Error updating diagnosis", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
