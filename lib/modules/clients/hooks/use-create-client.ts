"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateClientDto, CreateClientResponse } from "@/lib/types/client.types"
import { createClient } from "../services/clients.service"

export function useCreateClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CreateClientResponse | null>(null)

  const create = async (data: CreateClientDto): Promise<CreateClientResponse | null> => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await createClient(data)
      const res = { id: result, chartId: data.chartId }
      setResponse(res)

      toast.success("Client created successfully!", {
        description: `Chart ID: ${data.chartId}`,
      })

      return res
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create client"
      setError(errorMessage)

      toast.error("Error creating client", {
        description: errorMessage,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setError(null)
    setResponse(null)
    setIsLoading(false)
  }

  return { create, isLoading, error, response, reset }
}
