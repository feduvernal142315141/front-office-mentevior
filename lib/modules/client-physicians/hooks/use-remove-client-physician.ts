"use client"

import { useState } from "react"
import { toast } from "sonner"
import { removeClientPhysician } from "../services/client-physicians.service"

interface UseRemoveClientPhysicianReturn {
  remove: (clientPhysicianId: string) => Promise<number | null>
  isLoading: boolean
  error: string | null
}

export function useRemoveClientPhysician(): UseRemoveClientPhysicianReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (clientPhysicianId: string): Promise<number | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const progress = await removeClientPhysician(clientPhysicianId)
      toast.success("Physician removed successfully")
      return progress
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove physician"
      setError(message)
      toast.error("Error removing physician", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
