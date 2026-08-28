"use client"

import { useState, useEffect } from "react"
import type { Country } from "@/lib/types/address.types"
import { getCountries } from "../services/addresses.service"

interface UseCountriesReturn {
  countries: Country[]
  isLoading: boolean
  error: Error | null
}

export function useCountries(options?: { enabled?: boolean }): UseCountriesReturn {
  const [countries, setCountries] = useState<Country[]>([])
  const enabled = options?.enabled ?? true
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    const fetchCountries = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getCountries()
        setCountries(data)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to fetch countries")
        setError(errorObj)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountries()
  }, [enabled])

  return {
    countries,
    isLoading,
    error,
  }
}
