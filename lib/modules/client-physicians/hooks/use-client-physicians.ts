"use client"

import { useCallback, useEffect, useState } from "react"
import type { ClientPhysician } from "@/lib/types/client-physician.types"
import { getClientPhysicians } from "../services/client-physicians.service"

interface UseClientPhysiciansReturn {
  physicians: ClientPhysician[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClientPhysicians(clientId: string | null): UseClientPhysiciansReturn {
  const [physicians, setPhysicians] = useState<ClientPhysician[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPhysicians = useCallback(async () => {
    if (!clientId) {
      setPhysicians([])
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getClientPhysicians(clientId)
      setPhysicians(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch physicians"))
      setPhysicians([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchPhysicians()
  }, [fetchPhysicians])

  return { physicians, isLoading, error, refetch: fetchPhysicians }
}
