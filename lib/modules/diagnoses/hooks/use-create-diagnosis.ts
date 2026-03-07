"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateDiagnosisDto } from "@/lib/types/diagnosis.types"
import { createDiagnosis } from "../services/diagnoses.service"

interface UseCreateDiagnosisReturn {
  create: (data: CreateDiagnosisDto) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useCreateDiagnosis(): UseCreateDiagnosisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreateDiagnosisDto): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await createDiagnosis(data)
      toast.success("Diagnosis created successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create diagnosis"
      setError(message)
      toast.error("Error creating diagnosis", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
