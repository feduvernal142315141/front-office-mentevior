"use client"

import { useState } from "react"
import { toast } from "sonner"
import type {
  PriorAuthBillingCode,
  UpdateAuthorizationBillingCodeDto,
} from "@/lib/types/prior-authorization.types"
import { updateAuthorizationBillingCode } from "../services/authorization-billing-codes-api.service"

interface UseUpdateAuthorizationBillingCodeReturn {
  update: (data: UpdateAuthorizationBillingCodeDto) => Promise<PriorAuthBillingCode | null>
  isLoading: boolean
  error: string | null
}

export function useUpdateAuthorizationBillingCode(): UseUpdateAuthorizationBillingCodeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (
    data: UpdateAuthorizationBillingCodeDto
  ): Promise<PriorAuthBillingCode | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateAuthorizationBillingCode(data)
      toast.success("Billing code updated successfully")
      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update billing code"
      setError(message)
      toast.error("Error updating billing code", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
