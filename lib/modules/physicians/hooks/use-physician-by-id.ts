/**
 * USE PHYSICIAN BY ID
 * 
 * Hook to fetch a single physician by ID.
 */

"use client"

import { useState, useEffect } from "react"
import type { Physician } from "@/lib/types/physician.types"
import { getPhysicianById } from "../services/physicians.service"

interface UsePhysicianByIdReturn {
  physician: Physician | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function usePhysicianById(physicianId: string): UsePhysicianByIdReturn {
  const [physician, setPhysician] = useState<Physician | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPhysician = async () => {
    if (!physicianId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getPhysicianById(physicianId)
      setPhysician(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch physician")
      setError(errorObj)
      console.error("Error fetching physician:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPhysician()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physicianId])

  return {
    physician,
    isLoading,
    error,
    refetch: fetchPhysician,
  }
}
