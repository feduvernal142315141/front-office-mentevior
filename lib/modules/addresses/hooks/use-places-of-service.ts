"use client"

import { useState, useEffect } from "react"
import type { PlaceOfService } from "@/lib/types/address.types"
import { getPlacesOfService } from "../services/addresses.service"

interface UsePlacesOfServiceReturn {
  placesOfService: PlaceOfService[]
  isLoading: boolean
  error: Error | null
}

export function usePlacesOfService(): UsePlacesOfServiceReturn {
  const [placesOfService, setPlacesOfService] = useState<PlaceOfService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPlacesOfService = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getPlacesOfService()
        setPlacesOfService(data)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to fetch places of service")
        setError(errorObj)
        console.error("Error fetching places of service:", errorObj)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlacesOfService()
  }, [])

  return {
    placesOfService,
    isLoading,
    error,
  }
}
