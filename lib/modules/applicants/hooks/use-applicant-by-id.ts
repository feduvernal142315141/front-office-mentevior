/**
 * USE APPLICANT BY ID
 * 
 * Hook to fetch a single applicant by ID.
 * Automatically marks the applicant as read when viewed.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import type { Applicant } from "@/lib/types/applicant.types"
import { getApplicantById, markApplicantAsRead } from "../services/applicants.service"

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
  const hasMarkedAsRead = useRef(false)

  const fetchApplicant = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getApplicantById(applicantId)
      setApplicant(data)
      
      if (data && !data.isRead && !hasMarkedAsRead.current) {
        hasMarkedAsRead.current = true
        try {
          await markApplicantAsRead(applicantId, true)
          setApplicant({ ...data, isRead: true })
        } catch (markError) {
          console.error("Error marking applicant as read:", markError)
        }
      }
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
      hasMarkedAsRead.current = false
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
