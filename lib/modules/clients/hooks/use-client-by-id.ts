"use client"

import { useState, useEffect } from "react"
import type { Client } from "@/lib/types/client.types"
import { getClientById } from "../services/clients.service"

interface UseClientByIdReturn {
  client: Client | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useClientById(clientId: string | null): UseClientByIdReturn {
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchClient = async () => {
    if (!clientId) {
      setClient(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getClientById(clientId)

      if (!data) throw new Error("Client not found")

      setClient(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch client"))
      setClient(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClient()
  }, [clientId])

  return { client, isLoading, error, refetch: fetchClient }
}
