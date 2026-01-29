"use client"

import { useState, useEffect } from "react"
import type { AgreementListItem } from "@/lib/types/agreement.types"
import { getAgreements } from "../services/agreements.service"

interface UseAgreementsReturn {
  agreements: AgreementListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAgreements(): UseAgreementsReturn {
  const [agreements, setAgreements] = useState<AgreementListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAgreements = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAgreements()
      setAgreements(data.agreements)
      setTotalCount(data.totalCount)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch agreements")
      setError(errorObj)
      console.error("Error fetching agreements:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgreements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    agreements,
    totalCount,
    isLoading,
    error,
    refetch: fetchAgreements,
  }
}
