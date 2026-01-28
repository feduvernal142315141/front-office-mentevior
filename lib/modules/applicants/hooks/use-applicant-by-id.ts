/**
 * USE APPLICANT BY ID
 * 
 * Hook to fetch a single applicant by ID.
 */

"use client"

import { useState, useEffect } from "react"
import type { Applicant } from "@/lib/types/applicant.types"
import { getApplicantById } from "../services/applicants.service"

interface UseApplicantByIdReturn {
  applicant: Applicant | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useApplicantById(applicantId: string): UseApplicantByIdReturn {
  const [applicant, setApplicant] = useState<Applicant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchApplicant = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getApplicantById(applicantId)
      setApplicant(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch applicant")
      setError(errorObj)
      console.error("Error fetching applicant:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (applicantId) {
      fetchApplicant()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId])

  return {
    applicant,
    isLoading,
    error,
    refetch: fetchApplicant,
  }
}
