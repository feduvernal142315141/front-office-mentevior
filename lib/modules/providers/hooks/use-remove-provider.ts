"use client"

import { useState } from "react"
import { toast } from "sonner"
import { removeProvider } from "../services/providers.service"

interface UseRemoveProviderReturn {
  remove: (providerId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useRemoveProvider(): UseRemoveProviderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (providerId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await removeProvider(providerId)
      toast.success("Provider removed successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove provider"
      setError(message)
      toast.error("Error removing provider", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
