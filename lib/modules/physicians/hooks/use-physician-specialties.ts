"use client"

import { useState, useEffect } from "react"
import type { PhysicianSpecialty } from "@/lib/types/physician.types"
import { getPhysicianSpecialties } from "../services/physicians.service"

interface UsePhysicianSpecialtiesReturn {
  physicianSpecialties: PhysicianSpecialty[]
  isLoading: boolean
  error: Error | null
}

export function usePhysicianSpecialties(): UsePhysicianSpecialtiesReturn {
  const [physicianSpecialties, setPhysicianSpecialties] = useState<PhysicianSpecialty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPhysicianSpecialties = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getPhysicianSpecialties()
        setPhysicianSpecialties(data)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to fetch physician specialties")
        setError(errorObj)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhysicianSpecialties()
  }, [])

  return {
    physicianSpecialties,
    isLoading,
    error,
  }
}
