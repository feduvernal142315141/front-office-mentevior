"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreateClientInsuranceDto } from "@/lib/types/client-insurance.types"
import type { MutationResult } from "@/lib/types/response.types"
import { createClientInsurance } from "../services/client-insurances.service"

interface UseCreateClientInsuranceReturn {
  create: (data: CreateClientInsuranceDto) => Promise<MutationResult | null>
  isLoading: boolean
  error: string | null
}

export function useCreateClientInsurance(): UseCreateClientInsuranceReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreateClientInsuranceDto): Promise<MutationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createClientInsurance(data)
      toast.success("Insurance created successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create insurance"
      setError(message)
      toast.error("Error creating insurance", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
