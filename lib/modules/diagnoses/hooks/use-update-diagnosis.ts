"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateDiagnosisDto } from "@/lib/types/diagnosis.types"
import type { UpdateMutationResult } from "@/lib/types/response.types"
import { updateDiagnosis } from "../services/diagnoses.service"

interface UseUpdateDiagnosisReturn {
  update: (diagnosisId: string, data: UpdateDiagnosisDto) => Promise<UpdateMutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useUpdateDiagnosis(): UseUpdateDiagnosisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (diagnosisId: string, data: UpdateDiagnosisDto): Promise<UpdateMutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateDiagnosis(diagnosisId, data)
      toast.success("Diagnosis updated successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update diagnosis"
      setError(message)
      toast.error("Error updating diagnosis", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
