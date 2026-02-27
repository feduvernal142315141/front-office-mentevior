"use client"

import { useState, useEffect } from "react"
import type { GenderCatalogItem } from "../services/gender.service"
import { getGenderCatalog } from "../services/gender.service"

interface UseGenderCatalogReturn {
  genders: GenderCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function useGenderCatalog(): UseGenderCatalogReturn {
  const [genders, setGenders] = useState<GenderCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchGenders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getGenderCatalog()
        setGenders(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch genders"))
        setGenders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchGenders()
  }, [])

  return {
    genders,
    isLoading,
    error,
  }
}
