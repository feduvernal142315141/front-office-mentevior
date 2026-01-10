/**
 * USE UPDATE ACCOUNT PROFILE
 * 
 * Hook to update account profile.
 * Changes sync automatically with BO.
 */

"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateAccountProfileDto } from "@/lib/types/account-profile.types"
import { updateAccountProfile } from "../services/account-profile.service"

interface UseUpdateAccountProfileReturn {
  update: (data: UpdateAccountProfileDto) => Promise<boolean | null>
  isLoading: boolean
  error: Error | null
  reset: () => void
}

export function useUpdateAccountProfile(): UseUpdateAccountProfileReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (data: UpdateAccountProfileDto): Promise<boolean | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateAccountProfile(data)

      toast.success("Account profile updated successfully", {
        description: `${data.legalName} information has been updated and synced with BO.`,
      })

      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update account profile")
      setError(errorObj)

      toast.error("Failed to update account profile", {
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
