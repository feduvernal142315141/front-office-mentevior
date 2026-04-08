"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteClientInsurance } from "../services/client-insurances.service"

interface UseDeleteClientInsuranceReturn {
  remove: (insuranceId: string) => Promise<number | null>
  isLoading: boolean
  error: string | null
}

export function useDeleteClientInsurance(): UseDeleteClientInsuranceReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (insuranceId: string): Promise<number | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const progress = await deleteClientInsurance(insuranceId)
      toast.success("Insurance removed successfully")
      return progress
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove insurance"
      setError(message)
      toast.error("Error removing insurance", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
