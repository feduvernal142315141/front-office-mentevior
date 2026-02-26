"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateClientDto } from "@/lib/types/client.types"
import { updateClient } from "../services/clients.service"

interface UseUpdateClientReturn {
  update: (id: string, data: UpdateClientDto) => Promise<boolean | null>
  isLoading: boolean
  error: Error | null
  updatedClient: boolean | null
  reset: () => void
}

export function useUpdateClient(): UseUpdateClientReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [updatedClient, setUpdatedClient] = useState<boolean | null>(null)

  const update = async (id: string, data: UpdateClientDto): Promise<boolean | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateClient(id, data)
      setUpdatedClient(result)

      if (result) {
        toast.success("Client updated successfully")
      }

      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update client")
      setError(errorObj)
      setUpdatedClient(null)

      toast.error("Failed to update client", {
        description: errorObj.message,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setIsLoading(false)
    setError(null)
    setUpdatedClient(null)
  }

  return { update, isLoading, error, updatedClient, reset }
}
