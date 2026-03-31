"use client"

import { useState } from "react"
import { toast } from "sonner"
import { cancelPriorAuthorization } from "../services/prior-authorizations.service"

interface UseCancelPriorAuthorizationReturn {
  cancel: (paId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useCancelPriorAuthorization(): UseCancelPriorAuthorizationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancel = async (paId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await cancelPriorAuthorization(paId)
      toast.success("Prior Authorization cancelled successfully")
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel prior authorization"
      setError(message)
      toast.error("Error cancelling Prior Authorization", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { cancel, isLoading, error }
}
