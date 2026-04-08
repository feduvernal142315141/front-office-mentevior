"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteClientAddress } from "../services/client-addresses.service"

interface UseDeleteClientAddressReturn {
  remove: (id: string) => Promise<number | null>
  isLoading: boolean
  error: string | null
}

export function useDeleteClientAddress(): UseDeleteClientAddressReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (id: string): Promise<number | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const progress = await deleteClientAddress(id)
      toast.success("Address deleted successfully")
      return progress
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete address"
      setError(message)
      toast.error("Error deleting address", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
