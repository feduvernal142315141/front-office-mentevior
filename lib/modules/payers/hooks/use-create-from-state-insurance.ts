"use client"

import { useState } from "react"
import { toast } from "sonner"
import { getPayersService } from "../services/payers.service"

interface UseCreateFromStateInsuranceReturn {
  createFromCatalog: (ids: string[]) => Promise<boolean>
  isLoading: boolean
}

export function useCreateFromStateInsurance(): UseCreateFromStateInsuranceReturn {
  const [isLoading, setIsLoading] = useState(false)

  const createFromCatalog = async (ids: string[]): Promise<boolean> => {
    setIsLoading(true)

    try {
      await getPayersService().createFromStateInsurance(ids)
      const label = ids.length === 1 ? "Payer created successfully" : `${ids.length} payers created successfully`
      toast.success(label)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create payers"
      toast.error("Error creating payers", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { createFromCatalog, isLoading }
}
