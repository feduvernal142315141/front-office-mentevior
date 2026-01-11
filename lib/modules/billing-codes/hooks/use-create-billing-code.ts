
"use client"

import { useState } from "react"
import { createBillingCode } from "../services/billing-codes.service"
import type { CreateBillingCodeDto } from "@/lib/types/billing-code.types"
import { toast } from "sonner"

interface UseCreateBillingCodeReturn {
  create: (data: CreateBillingCodeDto) => Promise<string | null>
  isLoading: boolean
  error: Error | null
}

export function useCreateBillingCode(): UseCreateBillingCodeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: CreateBillingCodeDto): Promise<string | null> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const id = await createBillingCode(data)
      
      toast.success("Billing code added successfully", {
        description: `${data.code} has been added to your organization`,
      })
      
      return id
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create billing code")
      setError(errorObj)
      toast.error("Failed to add billing code", {
        description: errorObj.message,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    create,
    isLoading,
    error,
  }
}
