"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateManualClientPhysicianDto } from "@/lib/types/client-physician.types"
import { createManualClientPhysician } from "../services/client-physicians.service"

interface UseCreateManualClientPhysicianReturn {
  createManual: (data: CreateManualClientPhysicianDto) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

export function useCreateManualClientPhysician(): UseCreateManualClientPhysicianReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createManual = async (data: CreateManualClientPhysicianDto): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const createdPhysicianId = await createManualClientPhysician(data)
      toast.success("Physician added successfully")
      return createdPhysicianId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create physician"
      setError(message)
      toast.error("Error creating physician", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { createManual, isLoading, error }
}
