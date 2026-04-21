"use client"

import { useCallback, useEffect, useState } from "react"
import { getCompanyServices } from "../services/company-services.service"
import type { CompanyServiceListItem } from "@/lib/types/company-service.types"

interface UseCompanyServicesReturn {
  services: CompanyServiceListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCompanyServices(): UseCompanyServicesReturn {
  const [services, setServices] = useState<CompanyServiceListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getCompanyServices()
      setServices(data.services)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch services"))
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
