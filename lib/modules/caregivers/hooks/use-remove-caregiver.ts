"use client"

import { useState } from "react"
import { toast } from "sonner"
import { removeCaregiver } from "../services/caregivers.service"

interface UseRemoveCaregiverReturn {
  remove: (caregiverId: string) => Promise<number | null>
  isLoading: boolean
  error: string | null
}

export function useRemoveCaregiver(): UseRemoveCaregiverReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (caregiverId: string): Promise<number | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const progress = await removeCaregiver(caregiverId)
      toast.success("Caregiver removed successfully")
      return progress
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove caregiver"
      setError(message)
      toast.error("Error removing caregiver", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
