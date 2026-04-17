"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateCaregiverDto } from "@/lib/types/caregiver.types"
import type { UpdateMutationResult } from "@/lib/types/response.types"
import { updateCaregiver } from "../services/caregivers.service"

interface UseUpdateCaregiverReturn {
  update: (caregiverId: string, data: UpdateCaregiverDto) => Promise<UpdateMutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useUpdateCaregiver(): UseUpdateCaregiverReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (caregiverId: string, data: UpdateCaregiverDto): Promise<UpdateMutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateCaregiver(caregiverId, data)
      toast.success("Caregiver updated successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update caregiver"
      setError(message)
      toast.error("Error updating caregiver", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
