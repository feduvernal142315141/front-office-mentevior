"use client"

import { useEffect, useState } from "react"
import type { Payer } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UsePayersReturn {
  payers: Payer[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePayers(search: string): UsePayersReturn {
  const [payers, setPayers] = useState<Payer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let isActive = true

    const fetchPayers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getPayersService().list({ search })

        if (isActive) {
          setPayers(result)
        }
      } catch (fetchError) {
        if (isActive) {
          const message = fetchError instanceof Error ? fetchError.message : "Failed to fetch payers"
          setError(message)
          setPayers([])
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchPayers()
    return () => {
      isActive = false
    }
  }, [search, refreshIndex])

  const refresh = async () => {
    await getPayersService().refresh()
    setRefreshIndex((currentValue) => currentValue + 1)
  }

  return {
    payers,
    isLoading,
    error,
    refresh,
  }
}
