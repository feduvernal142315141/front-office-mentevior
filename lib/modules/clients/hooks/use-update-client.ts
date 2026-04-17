"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateClientDto } from "@/lib/types/client.types"
import type { UpdateMutationResult } from "@/lib/types/response.types"
import { updateClient } from "../services/clients.service"

interface UseUpdateClientReturn {
  update: (id: string, data: UpdateClientDto) => Promise<UpdateMutationResult | null>
  isLoading: boolean
  error: Error | null
}

export function useUpdateClient(): UseUpdateClientReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (id: string, data: UpdateClientDto): Promise<UpdateMutationResult | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateClient(id, data)
      toast.success("Client updated successfully")
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update client")
      setError(errorObj)
      toast.error("Failed to update client", { description: errorObj.message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
