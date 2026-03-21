"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { Payer, UpdatePayerPlanDto } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UseConfigurePayerPlanReturn {
  configure: (data: UpdatePayerPlanDto) => Promise<Payer | null>
  isLoading: boolean
  error: string | null
}

export function useConfigurePayerPlan(): UseConfigurePayerPlanReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configure = async (data: UpdatePayerPlanDto): Promise<Payer | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const payer = await getPayersService().updatePlan(data)
      toast.success("Plan updated successfully")
      return payer
    } catch (configureError) {
      const message = configureError instanceof Error ? configureError.message : "Failed to update plan"
      setError(message)
      toast.error("Error updating plan", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { configure, isLoading, error }
}
