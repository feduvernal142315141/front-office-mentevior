"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { AssignProviderDto } from "@/lib/types/provider.types"
import { assignProvider } from "../services/providers.service"

interface UseAssignProviderReturn {
  assign: (data: AssignProviderDto) => Promise<string | null>
  assignMany: (clientId: string, userIds: string[]) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useAssignProvider(): UseAssignProviderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assign = async (data: AssignProviderDto): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const providerId = await assignProvider(data)
      toast.success("Provider assigned successfully")
      return providerId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign provider"
      setError(message)
      toast.error("Error assigning provider", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const assignMany = async (clientId: string, userIds: string[]): Promise<boolean> => {
    if (!userIds.length) return false

    setIsLoading(true)
    setError(null)

    try {
      await assignProvider({ clientId, userId: userIds })
      toast.success(
        userIds.length === 1
          ? "Provider assigned successfully"
          : `${userIds.length} providers assigned successfully`
      )
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign providers"
      setError(message)
      toast.error("Error assigning providers", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { assign, assignMany, isLoading, error }
}
