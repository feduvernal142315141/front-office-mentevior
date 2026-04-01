"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteAuthorizationBillingCode } from "../services/authorization-billing-codes-api.service"

interface UseDeleteAuthorizationBillingCodeReturn {
  remove: (id: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useDeleteAuthorizationBillingCode(): UseDeleteAuthorizationBillingCodeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteAuthorizationBillingCode(id)
      toast.success("Billing code removed successfully")
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove billing code"
      setError(message)
      toast.error("Error removing billing code", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
