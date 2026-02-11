/**
 * USE UPDATE GENERAL INFORMATION
 *
 * Hook to update the current user's general information.
 * Endpoint: PUT /member-users/general-information
 */

"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateGeneralInformationDto } from "@/lib/types/general-information.types"
import { updateGeneralInformation } from "../services/general-information.service"

interface UseUpdateGeneralInformationReturn {
  update: (data: UpdateGeneralInformationDto) => Promise<boolean | null>
  isLoading: boolean
  error: Error | null
  reset: () => void
}

export function useUpdateGeneralInformation(): UseUpdateGeneralInformationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (
    data: UpdateGeneralInformationDto
  ): Promise<boolean | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateGeneralInformation(data)

      toast.success("Information updated successfully", {
        description: "Your profile has been updated.",
      })

      return result
    } catch (err) {
      const errorObj =
        err instanceof Error
          ? err
          : new Error("Failed to update general information")
      setError(errorObj)

      toast.error("Failed to update information", {
        description: errorObj.message,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setIsLoading(false)
    setError(null)
  }

  return {
    update,
    isLoading,
    error,
    reset,
  }
}
