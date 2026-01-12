"use client"

import { useState, useEffect } from "react"
import type { PhysicianType } from "@/lib/types/physician.types"
import { getPhysicianTypes } from "../services/physicians.service"

interface UsePhysicianTypesReturn {
  physicianTypes: PhysicianType[]
  isLoading: boolean
  error: Error | null
}

export function usePhysicianTypes(): UsePhysicianTypesReturn {
  const [physicianTypes, setPhysicianTypes] = useState<PhysicianType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
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
  }, [])

  return {
    physicianTypes,
    isLoading,
    error,
  }
}
