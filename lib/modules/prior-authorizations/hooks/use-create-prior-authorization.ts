"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreatePriorAuthorizationDto } from "@/lib/types/prior-authorization.types"
import type { MutationResult } from "@/lib/types/response.types"
import { createPriorAuthorization } from "../services/prior-authorizations.service"

interface UseCreatePriorAuthorizationReturn {
  create: (data: CreatePriorAuthorizationDto) => Promise<MutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useCreatePriorAuthorization(): UseCreatePriorAuthorizationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (
    data: CreatePriorAuthorizationDto
  ): Promise<MutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createPriorAuthorization(data)
      toast.success("Prior Authorization created successfully")
      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create prior authorization"
      setError(message)
      toast.error("Error creating Prior Authorization", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
