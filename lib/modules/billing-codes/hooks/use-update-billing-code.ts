"use client"

import { useState } from "react"
import { updateBillingCode } from "../services/billing-codes.service"
import type { UpdateBillingCodeDto } from "@/lib/types/billing-code.types"
import { toast } from "sonner"

interface UseUpdateBillingCodeReturn {
  update: (data: UpdateBillingCodeDto) => Promise<boolean>
  isLoading: boolean
  error: Error | null
}

export function useUpdateBillingCode(): UseUpdateBillingCodeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (data: UpdateBillingCodeDto): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      
      await updateBillingCode(data)
      
      toast.success("Billing code updated successfully", {
        description: `${data.code} has been updated`,
      })
      
      return true
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update billing code")
      setError(errorObj)
      toast.error("Failed to update billing code", {
        description: errorObj.message,
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    update,
    isLoading,
    error,
  }
}
