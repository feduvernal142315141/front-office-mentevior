"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { AssignProviderDto } from "@/lib/types/provider.types"
import type { MutationResult } from "@/lib/types/response.types"
import { assignProvider } from "../services/providers.service"

interface UseAssignProviderReturn {
  assign: (data: AssignProviderDto) => Promise<MutationResult | null>
  assignMany: (clientId: string, userIds: string[]) => Promise<MutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useAssignProvider(): UseAssignProviderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assign = async (data: AssignProviderDto): Promise<MutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await assignProvider(data)
      toast.success("Provider assigned successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign provider"
      setError(message)
      toast.error("Error assigning provider", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const assignMany = async (clientId: string, userIds: string[]): Promise<MutationResult | null> => {
    if (!userIds.length) return null

    setIsLoading(true)
    setError(null)

    try {
      const result = await assignProvider({ clientId, userId: userIds })
      toast.success(
        userIds.length === 1
          ? "Provider assigned successfully"
          : `${userIds.length} providers assigned successfully`
      )
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign providers"
      setError(message)
      toast.error("Error assigning providers", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { assign, assignMany, isLoading, error }
}
