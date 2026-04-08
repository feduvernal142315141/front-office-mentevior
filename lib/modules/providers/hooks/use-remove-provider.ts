"use client"

import { useState } from "react"
import { toast } from "sonner"
import { removeProvider } from "../services/providers.service"

interface UseRemoveProviderReturn {
  remove: (providerId: string) => Promise<number | null>
  isLoading: boolean
  error: string | null
}

export function useRemoveProvider(): UseRemoveProviderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (providerId: string): Promise<number | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const progress = await removeProvider(providerId)
      toast.success("Provider removed successfully")
      return progress
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove provider"
      setError(message)
      toast.error("Error removing provider", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
