"use client"

import { useCallback, useState } from "react"
import { getCompanyServiceById } from "../services/company-services.service"
import type { CompanyService } from "@/lib/types/company-service.types"

interface UseCompanyServiceByIdReturn {
  service: CompanyService | null
  isLoading: boolean
  error: Error | null
  fetchById: (id: string) => Promise<CompanyService | null>
  clear: () => void
}

export function useCompanyServiceById(): UseCompanyServiceByIdReturn {
  const [service, setService] = useState<CompanyService | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchById = useCallback(async (id: string): Promise<CompanyService | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getCompanyServiceById(id)
      setService(data)
      return data
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error("Failed to fetch service details")
      setError(normalized)
      setService(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setService(null)
    setError(null)
  }, [])

  return { service, isLoading, error, fetchById, clear }
}
