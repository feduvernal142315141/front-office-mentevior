"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateCaregiverDto } from "@/lib/types/caregiver.types"
import { createCaregiver } from "../services/caregivers.service"

interface UseCreateCaregiverReturn {
  create: (data: CreateCaregiverDto) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

export function useCreateCaregiver(): UseCreateCaregiverReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreateCaregiverDto): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const caregiverId = await createCaregiver(data)
      toast.success("Caregiver created successfully")
      return caregiverId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create caregiver"
      setError(message)
      toast.error("Error creating caregiver", {
        description: message,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
