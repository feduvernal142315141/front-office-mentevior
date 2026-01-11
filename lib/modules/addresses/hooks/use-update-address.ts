"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateAddressDto } from "@/lib/types/address.types"
import { updateAddress } from "../services/addresses.service"

interface UseUpdateAddressReturn {
  update: (data: UpdateAddressDto) => Promise<boolean | null>
  isLoading: boolean
  error: Error | null
  updatedAddress: boolean | null
  reset: () => void
}

export function useUpdateAddress(): UseUpdateAddressReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [updatedAddress, setUpdatedAddress] = useState<boolean | null>(null)

  const update = async (data: UpdateAddressDto): Promise<boolean | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateAddress(data)
      setUpdatedAddress(result)

      toast.success("Address updated successfully", {
        description: `${data.nickName} has been updated.`,
      })

      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update address")
      setError(errorObj)
      setUpdatedAddress(null)

      toast.error("Failed to update address", {
        description: errorObj.message,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setIsLoading(false)
    setError(null)
    setUpdatedAddress(null)
  }

  return {
    update,
    isLoading,
    error,
    updatedAddress,
    reset,
  }
}
