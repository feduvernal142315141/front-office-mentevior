/**
 * USE GENERAL INFORMATION
 *
 * Hook to fetch the current user's general information.
 * Endpoint: GET /member-users/general-information
 */

"use client"

import { useState, useEffect } from "react"
import type { GeneralInformation } from "@/lib/types/general-information.types"
import { getGeneralInformation } from "../services/general-information.service"

interface UseGeneralInformationReturn {
  generalInformation: GeneralInformation | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useGeneralInformation(
  memberUserId: string | null
): UseGeneralInformationReturn {
  const [generalInformation, setGeneralInformation] =
    useState<GeneralInformation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGeneralInformation = async () => {
    try {
      setIsLoading(true)
      setError(null)
      if (!memberUserId) {
        setGeneralInformation(null)
        return
      }
      const data = await getGeneralInformation(memberUserId)
      setGeneralInformation(data)
    } catch (err) {
      const errorObj =
        err instanceof Error
          ? err
          : new Error("Failed to fetch general information")
      setError(errorObj)
      console.error("Error fetching general information:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGeneralInformation()
  }, [memberUserId])

  return {
    generalInformation,
    isLoading,
    error,
    refetch: fetchGeneralInformation,
  }
}
