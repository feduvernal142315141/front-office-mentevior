"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { CreatePayerDto, Payer } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UseCreatePayerReturn {
  create: (data: CreatePayerDto) => Promise<Payer | null>
  isLoading: boolean
  error: string | null
}

export function useCreatePayer(): UseCreatePayerReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: CreatePayerDto): Promise<Payer | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const payer = await getPayersService().create(data)
      toast.success("Payer created successfully")
      return payer
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Failed to create payer"
      setError(message)
      toast.error("Error creating payer", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading, error }
}
