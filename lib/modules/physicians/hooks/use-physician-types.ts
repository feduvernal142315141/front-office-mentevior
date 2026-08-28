"use client"

import { useState, useEffect } from "react"
import type { PhysicianType } from "@/lib/types/physician.types"
import { getPhysicianTypes } from "../services/physicians.service"

interface UsePhysicianTypesReturn {
  physicianTypes: PhysicianType[]
  isLoading: boolean
  error: Error | null
}

export function usePhysicianTypes(options?: { enabled?: boolean }): UsePhysicianTypesReturn {
  const [physicianTypes, setPhysicianTypes] = useState<PhysicianType[]>([])
  const enabled = options?.enabled ?? true
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    const fetchPhysicianTypes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getPhysicianTypes()
        setPhysicianTypes(data)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to fetch physician types")
        setError(errorObj)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhysicianTypes()
  }, [enabled])

  return {
    physicianTypes,
    isLoading,
    error,
  }
}
