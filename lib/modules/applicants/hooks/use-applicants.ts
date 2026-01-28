/**
 * USE APPLICANTS
 * 
 * Hook to fetch paginated applicants list.
 */

"use client"

import { useState, useEffect } from "react"
import type { Applicant } from "@/lib/types/applicant.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getApplicants } from "../services/applicants.service"

interface UseApplicantsReturn {
  applicants: Applicant[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (query?: QueryModel) => Promise<void>
}

export function useApplicants(initialQuery?: QueryModel): UseApplicantsReturn {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchApplicants = async (query?: QueryModel) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getApplicants(query || initialQuery || {})
      setApplicants(data.applicants)
      setTotalCount(data.totalCount)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch applicants")
      setError(errorObj)
      console.error("Error fetching applicants:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApplicants(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    applicants,
    totalCount,
    isLoading,
    error,
    refetch: fetchApplicants,
  }
}
