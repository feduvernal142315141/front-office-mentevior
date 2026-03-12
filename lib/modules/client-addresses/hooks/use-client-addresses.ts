"use client"

import { useCallback, useEffect, useState } from "react"
import type { ClientAddress } from "@/lib/types/client-address.types"
import { getClientAddressesByClientId } from "../services/client-addresses.service"

interface UseClientAddressesReturn {
  addresses: ClientAddress[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClientAddresses(clientId: string | null): UseClientAddressesReturn {
  const [addresses, setAddresses] = useState<ClientAddress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAddresses = useCallback(async () => {
    if (!clientId) {
      setAddresses([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getClientAddressesByClientId(clientId)
      setAddresses(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch addresses")
      setError(errorObj)
      setAddresses([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchAddresses()
  }, [fetchAddresses])

  return {
    addresses,
    isLoading,
    error,
    refetch: fetchAddresses,
  }
}
