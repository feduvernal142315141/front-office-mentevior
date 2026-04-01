"use client"

import { useState } from "react"
import { toast } from "sonner"
import type {
  PriorAuthBillingCode,
  CreateAuthorizationBillingCodeDto,
} from "@/lib/types/prior-authorization.types"
import { createAuthorizationBillingCode } from "../services/authorization-billing-codes-api.service"

interface UseCreateAuthorizationBillingCodeReturn {
  create: (data: CreateAuthorizationBillingCodeDto) => Promise<PriorAuthBillingCode | null>
  isLoading: boolean
  error: string | null
}

export function useCreateAuthorizationBillingCode(): UseCreateAuthorizationBillingCodeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (
    data: CreateAuthorizationBillingCodeDto
  ): Promise<PriorAuthBillingCode | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createAuthorizationBillingCode(data)
      toast.success("Billing code added successfully")
      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add billing code"
      setError(message)
      toast.error("Error adding billing code", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
