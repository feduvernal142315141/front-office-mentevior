/**
 * USE ADDRESSES
 * 
 * Hook to fetch paginated addresses list.
 */

"use client"

import { useState, useEffect } from "react"
import type { AddressListItem } from "@/lib/types/address.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getAddresses } from "../services/addresses.service"

interface UseAddressesReturn {
  addresses: AddressListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (query?: QueryModel) => Promise<void>
}

export function useAddresses(initialQuery?: QueryModel): UseAddressesReturn {
  const [addresses, setAddresses] = useState<AddressListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAddresses = async (query?: QueryModel) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAddresses(query || initialQuery || {})
      setAddresses(data.addresses)
      setTotalCount(data.totalCount)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch addresses")
      setError(errorObj)
      console.error("Error fetching addresses:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    addresses,
    totalCount,
    isLoading,
    error,
    refetch: fetchAddresses,
  }
}
