"use client"

import { useState, useEffect } from "react"
import type { State } from "@/lib/types/address.types"
import { getStatesByCountry } from "../services/addresses.service"

interface UseStatesReturn {
  states: State[]
  isLoading: boolean
  error: Error | null
}

export function useStates(countryId: string | null): UseStatesReturn {
  const [states, setStates] = useState<State[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!countryId) {
      setStates([])
      setIsLoading(false)
      setError(null)
      return
    }

    const fetchStates = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getStatesByCountry(countryId)
        setStates(data)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to fetch states")
        setError(errorObj)
        console.error("Error fetching states:", errorObj)
        setStates([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchStates()
  }, [countryId])

  return {
    states,
    isLoading,
    error,
  }
}
