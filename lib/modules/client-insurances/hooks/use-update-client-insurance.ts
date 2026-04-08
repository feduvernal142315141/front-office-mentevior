"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UpdateClientInsuranceDto } from "@/lib/types/client-insurance.types"
import type { MutationResult } from "@/lib/types/response.types"
import { updateClientInsurance } from "../services/client-insurances.service"

interface UseUpdateClientInsuranceReturn {
  update: (data: UpdateClientInsuranceDto) => Promise<MutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useUpdateClientInsurance(): UseUpdateClientInsuranceReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (data: UpdateClientInsuranceDto): Promise<MutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateClientInsurance(data)
      toast.success("Insurance updated successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update insurance"
      setError(message)
      toast.error("Error updating insurance", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
