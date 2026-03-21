"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { Payer, UpdatePayerDto } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UseUpdatePayerReturn {
  update: (data: UpdatePayerDto) => Promise<Payer | null>
  isLoading: boolean
  error: string | null
}

export function useUpdatePayer(): UseUpdatePayerReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (data: UpdatePayerDto): Promise<Payer | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const payer = await getPayersService().update(data)
      toast.success("Payer updated successfully")
      return payer
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Failed to update payer"
      setError(message)
      toast.error("Error updating payer", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading, error }
}
