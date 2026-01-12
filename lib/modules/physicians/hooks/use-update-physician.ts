/**
 * USE UPDATE PHYSICIAN
 * 
 * Hook to handle physician updates with loading and error states.
 */

"use client"

import { useState } from "react"
import type { UpdatePhysicianRequest } from "@/lib/types/physician.types"
import { updatePhysician } from "../services/physicians.service"

interface UseUpdatePhysicianReturn {
  update: (data: UpdatePhysicianRequest) => Promise<void>
  isUpdating: boolean
  error: Error | null
}

export function useUpdatePhysician(): UseUpdatePhysicianReturn {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (data: UpdatePhysicianRequest): Promise<void> => {
    try {
      setIsUpdating(true)
      setError(null)
      await updatePhysician(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update physician")
      setError(errorObj)
      console.error("Error updating physician:", errorObj)
      throw errorObj
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    update,
    isUpdating,
    error,
  }
}
