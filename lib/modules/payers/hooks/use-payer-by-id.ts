"use client"

import { useState, useEffect } from "react"
import type { Payer } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UsePayerByIdReturn {
  payer: Payer | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function usePayerById(payerId: string | null): UsePayerByIdReturn {
  const [payer, setPayer] = useState<Payer | null>(null)
  const [isLoading, setIsLoading] = useState(!!payerId)
  const [error, setError] = useState<Error | null>(null)

  const fetchPayer = async (options?: { silent?: boolean }) => {
    if (!payerId) {
      setIsLoading(false)
      return
    }

    try {
      if (!options?.silent) {
        setIsLoading(true)
      }
      setError(null)
      const data = await getPayersService().getById(payerId)
      setPayer(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch payer")
      setError(errorObj)
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchPayer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payerId])

  return {
    payer,
    isLoading,
    error,
    refetch: () => fetchPayer({ silent: true }),
  }
}
