"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteClientInsurance } from "../services/client-insurances.service"

interface UseDeleteClientInsuranceReturn {
  remove: (insuranceId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useDeleteClientInsurance(): UseDeleteClientInsuranceReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (insuranceId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteClientInsurance(insuranceId)
      toast.success("Insurance removed successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove insurance"
      setError(message)
      toast.error("Error removing insurance", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
