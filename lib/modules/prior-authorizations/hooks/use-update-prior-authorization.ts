"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdatePriorAuthorizationDto } from "@/lib/types/prior-authorization.types"
import type { MutationResult } from "@/lib/types/response.types"
import { updatePriorAuthorization } from "../services/prior-authorizations.service"

interface UseUpdatePriorAuthorizationReturn {
  update: (data: UpdatePriorAuthorizationDto) => Promise<MutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useUpdatePriorAuthorization(): UseUpdatePriorAuthorizationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (
    data: UpdatePriorAuthorizationDto
  ): Promise<MutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updatePriorAuthorization(data)
      toast.success("Prior Authorization updated successfully")
      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update prior authorization"
      setError(message)
      toast.error("Error updating Prior Authorization", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
