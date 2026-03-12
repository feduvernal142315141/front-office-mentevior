"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateClientAddressDto } from "@/lib/types/client-address.types"
import { createClientAddress } from "../services/client-addresses.service"

interface UseCreateClientAddressReturn {
  create: (data: CreateClientAddressDto) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

export function useCreateClientAddress(): UseCreateClientAddressReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreateClientAddressDto): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const addressId = await createClientAddress(data)
      toast.success("Address created successfully")
      return addressId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create address"
      setError(message)
      toast.error("Error creating address", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
