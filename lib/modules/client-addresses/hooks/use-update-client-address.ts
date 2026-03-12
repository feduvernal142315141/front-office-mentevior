"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateClientAddressDto } from "@/lib/types/client-address.types"
import { updateClientAddress } from "../services/client-addresses.service"

interface UseUpdateClientAddressReturn {
  update: (data: UpdateClientAddressDto) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

export function useUpdateClientAddress(): UseUpdateClientAddressReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (data: UpdateClientAddressDto): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const addressId = await updateClientAddress(data)
      toast.success("Address updated successfully")
      return addressId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update address"
      setError(message)
      toast.error("Error updating address", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
