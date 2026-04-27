"use client"

import { useCallback, useEffect, useState } from "react"
import { getCompanyActiveServices } from "../services/company-services.service"
import type { CompanyServiceListItem } from "@/lib/types/company-service.types"

interface UseCompanyActiveServicesReturn {
  services: CompanyServiceListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCompanyActiveServices(): UseCompanyActiveServicesReturn {
  const [services, setServices] = useState<CompanyServiceListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getCompanyActiveServices()
      setServices(data.services)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch active services"))
      setServices([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchServices()
  }, [fetchServices])

  return {
    services,
    totalCount,
    isLoading,
    error,
    refetch: fetchServices,
  }
}
