"use client"

import { useState } from "react"
import { toast } from "sonner"
import { removeMedication } from "../services/medications.service"

interface UseRemoveMedicationReturn {
  remove: (medicationId: string) => Promise<number | null>
  isLoading: boolean
  error: string | null
}

export function useRemoveMedication(): UseRemoveMedicationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (medicationId: string): Promise<number | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const progress = await removeMedication(medicationId)
      toast.success("Medication removed successfully")
      return progress
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove medication"
      setError(message)
      toast.error("Error removing medication", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
