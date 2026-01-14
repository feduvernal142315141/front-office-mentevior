"use client"

import { useState, useEffect } from "react"
import type { BillingCodeTypeItem } from "@/lib/types/billing-code.types"
import { getBillingCodeTypes } from "../services/billing-codes.service"

interface UseBillingCodeTypesReturn {
  types: BillingCodeTypeItem[]
  isLoading: boolean
  error: Error | null
  getTypeIdByName: (name: string) => string | undefined
}

export function useBillingCodeTypes(): UseBillingCodeTypesReturn {
  const [types, setTypes] = useState<BillingCodeTypeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getBillingCodeTypes()
        setTypes(data)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to fetch billing code types")
        setError(errorObj)
        console.error("Error fetching billing code types:", errorObj)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTypes()
  }, [])

  const getTypeIdByName = (name: string) => {
    return types.find(t => t.name === name)?.id
  }

  return {
    types,
    isLoading,
    error,
    getTypeIdByName,
  }
}
