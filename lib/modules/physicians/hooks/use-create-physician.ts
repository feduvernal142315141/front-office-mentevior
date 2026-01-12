/**
 * USE CREATE PHYSICIAN
 * 
 * Hook to handle physician creation with loading and error states.
 */

"use client"

import { useState } from "react"
import type { CreatePhysicianRequest } from "@/lib/types/physician.types"
import { createPhysician } from "../services/physicians.service"

interface UseCreatePhysicianReturn {
  create: (data: CreatePhysicianRequest) => Promise<string>
  isCreating: boolean
  error: Error | null
}

export function useCreatePhysician(): UseCreatePhysicianReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: CreatePhysicianRequest): Promise<string> => {
    try {
      setIsCreating(true)
      setError(null)
      const physicianId = await createPhysician(data)
      return physicianId
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create physician")
      setError(errorObj)
      console.error("Error creating physician:", errorObj)
      throw errorObj
    } finally {
      setIsCreating(false)
    }
  }

  return {
    create,
    isCreating,
    error,
  }
}
