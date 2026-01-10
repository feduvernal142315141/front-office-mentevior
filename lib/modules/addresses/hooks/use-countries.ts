"use client"

import { useState, useEffect } from "react"
import type { Country } from "@/lib/types/address.types"
import { getCountries } from "../services/addresses.service"

interface UseCountriesReturn {
  countries: Country[]
  isLoading: boolean
  error: Error | null
}

export function useCountries(): UseCountriesReturn {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getCountries()
        setCountries(data)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to fetch countries")
        setError(errorObj)
        console.error("Error fetching countries:", errorObj)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return {
    countries,
    isLoading,
    error,
  }
}
