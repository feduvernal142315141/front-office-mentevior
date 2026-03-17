"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateDiagnosisDto } from "@/lib/types/diagnosis.types"
import type { MutationResult } from "@/lib/types/response.types"
import { createDiagnosis } from "../services/diagnoses.service"

interface UseCreateDiagnosisReturn {
  create: (data: CreateDiagnosisDto) => Promise<MutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useCreateDiagnosis(): UseCreateDiagnosisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreateDiagnosisDto): Promise<MutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createDiagnosis(data)
      toast.success("Diagnosis created successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create diagnosis"
      setError(message)
      toast.error("Error creating diagnosis", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
