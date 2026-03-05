"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateMedicationDto } from "@/lib/types/medication.types"
import { createMedication } from "../services/medications.service"

interface UseCreateMedicationReturn {
  create: (data: CreateMedicationDto) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

export function useCreateMedication(): UseCreateMedicationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreateMedicationDto): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const medicationId = await createMedication(data)
      toast.success("Medication created successfully")
      return medicationId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create medication"
      setError(message)
      toast.error("Error creating medication", {
        description: message,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
