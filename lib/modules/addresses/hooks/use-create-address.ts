/**
 * USE CREATE ADDRESS
 * 
 * Hook to create a new address.
 */

"use client"

import { useState } from "react"
import type { CreateAddressDto } from "@/lib/types/address.types"
import { toast } from "sonner"
import { createAddress } from "../services/addresses.service"

interface CreateAddressResponse {
  id: string
}

export function useCreateAddress() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CreateAddressResponse | null>(null)

  const create = async (data: CreateAddressDto): Promise<CreateAddressResponse | null> => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await createAddress(data)
      const res = { id: result }
      setResponse(res)
      
      toast.success("Address created successfully!", {
        description: `${data.nickName} has been added to your addresses.`,
      })
      
      return res
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create address"
      setError(errorMessage)
      
      toast.error("Error creating address", {
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

  return {
    create,
    isLoading,
    error,
    response,
    reset,
  }
}
