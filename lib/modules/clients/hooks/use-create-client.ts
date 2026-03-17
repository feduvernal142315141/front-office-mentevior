"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateClientDto } from "@/lib/types/client.types"
import type { MutationResult } from "@/lib/types/response.types"
import { createClient } from "../services/clients.service"

interface UseCreateClientReturn {
  create: (data: CreateClientDto) => Promise<MutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useCreateClient(): UseCreateClientReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreateClientDto): Promise<MutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createClient(data)
      toast.success("Client created successfully!")
      return { progress: result.progress, clientId: result.clientId }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create client"
      setError(errorMessage)
      toast.error("Error creating client", { description: errorMessage })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
