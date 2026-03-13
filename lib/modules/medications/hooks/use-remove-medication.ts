"use client"

import { useState } from "react"
import { toast } from "sonner"
import { removeMedication } from "../services/medications.service"

interface UseRemoveMedicationReturn {
  remove: (medicationId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useRemoveMedication(): UseRemoveMedicationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (medicationId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await removeMedication(medicationId)
      toast.success("Medication removed successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove medication"
      setError(message)
      toast.error("Error removing medication", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
