/**
 * USE PHYSICIANS
 * 
 * Hook to fetch paginated physicians list.
 */

"use client"

import { useState, useEffect } from "react"
import type { Physician } from "@/lib/types/physician.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getPhysicians } from "../services/physicians.service"

interface UsePhysiciansReturn {
  physicians: Physician[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (query?: QueryModel) => Promise<void>
}

export function usePhysicians(initialQuery?: QueryModel): UsePhysiciansReturn {
  const [physicians, setPhysicians] = useState<Physician[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPhysicians = async (query?: QueryModel) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getPhysicians(query || initialQuery || {})
      setPhysicians(data.physicians)
      setTotalCount(data.totalCount)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch physicians")
      setError(errorObj)
      console.error("Error fetching physicians:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPhysicians(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    physicians,
    totalCount,
    isLoading,
    error,
    refetch: fetchPhysicians,
  }
}
