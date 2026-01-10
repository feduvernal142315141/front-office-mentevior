/**
 * USE ADDRESS BY ID
 * 
 * Hook to fetch a single address by ID.
 */

"use client"

import { useState, useEffect } from "react"
import type { Address } from "@/lib/types/address.types"
import { getAddressById } from "../services/addresses.service"

interface UseAddressByIdReturn {
  address: Address | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAddressById(addressId: string | null): UseAddressByIdReturn {
  const [address, setAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState(!!addressId)
  const [error, setError] = useState<Error | null>(null)

  const fetchAddress = async () => {
    if (!addressId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getAddressById(addressId)
      setAddress(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch address")
      setError(errorObj)
      console.error("Error fetching address:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAddress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId])

  return {
    address,
    isLoading,
    error,
    refetch: fetchAddress,
  }
}
