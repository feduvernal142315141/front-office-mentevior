"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateMedicationDto } from "@/lib/types/medication.types"
import type { UpdateMutationResult } from "@/lib/types/response.types"
import { updateMedication } from "../services/medications.service"

interface UseUpdateMedicationReturn {
  update: (medicationId: string, data: UpdateMedicationDto) => Promise<UpdateMutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useUpdateMedication(): UseUpdateMedicationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (medicationId: string, data: UpdateMedicationDto): Promise<UpdateMutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateMedication(medicationId, data)
      toast.success("Medication updated successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update medication"
      setError(message)
      toast.error("Error updating medication", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
