"use client"

import { useState } from "react"
import { toast } from "sonner"
import { updateProvider } from "../services/providers.service"
import type { UpdateProviderDto } from "@/lib/types/provider.types"

interface UseUpdateProviderReturn {
  update: (data: UpdateProviderDto) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useUpdateProvider(): UseUpdateProviderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (data: UpdateProviderDto): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await updateProvider(data)
      toast.success("Provider updated successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update provider"
      setError(message)
      toast.error("Error updating provider", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
