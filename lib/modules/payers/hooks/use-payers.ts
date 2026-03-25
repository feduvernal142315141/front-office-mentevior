"use client"

import { useEffect, useState } from "react"
import type { Payer } from "@/lib/types/payer.types"
import { buildFilters } from "@/lib/utils/query-filters"
import { getPayersService } from "../services/payers.service"

interface UsePayersReturn {
  payers: Payer[]
  totalCount: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePayers(search: string, page: number, pageSize: number): UsePayersReturn {
  const [payers, setPayers] = useState<Payer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let isActive = true

    const fetchPayers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const trimmed = search.trim()
        const filters =
          trimmed !== "" ? buildFilters([], { fields: ["name"], search: trimmed }) : undefined

        const { payers: nextPayers, totalCount: nextTotal } = await getPayersService().list({
          filters,
          page,
          pageSize,
        })

        if (isActive) {
          setPayers(nextPayers)
          setTotalCount(nextTotal)
        }
      } catch (fetchError) {
        if (isActive) {
          const message = fetchError instanceof Error ? fetchError.message : "Failed to fetch payers"
          setError(message)
          setPayers([])
          setTotalCount(0)
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
  }, [search, page, pageSize, refreshIndex])

  const refresh = async () => {
    await getPayersService().refresh()
    setRefreshIndex((currentValue) => currentValue + 1)
  }

  return {
    payers,
    totalCount,
    isLoading,
    error,
    refresh,
  }
}
