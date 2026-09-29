"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  const requestIdRef = useRef(0)

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setClient(null)
      setIsLoading(false)
      return
    }

    const requestId = ++requestIdRef.current

    try {
      setIsLoading(true)
      setError(null)
      const data = await getClientById(clientId)

      if (requestId !== requestIdRef.current) return

      if (!data) throw new Error("Client not found")

      setClient(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err : new Error("Failed to fetch client"))
      setClient(null)
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  return { client, isLoading, error, refetch: fetchClient }
}
