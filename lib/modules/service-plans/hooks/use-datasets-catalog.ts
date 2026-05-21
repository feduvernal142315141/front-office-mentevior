"use client"

import { useCallback, useEffect, useState } from "react"

import {
  getDatasetsCatalog,
  type DatasetCatalogEntry,
} from "@/lib/modules/service-plans/services/datasets-catalog.service"

interface UseDatasetsCatalogReturn {
  entries: DatasetCatalogEntry[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDatasetsCatalog(enabled = true): UseDatasetsCatalogReturn {
  const [entries, setEntries] = useState<DatasetCatalogEntry[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const fetchCatalog = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await getDatasetsCatalog()
      setEntries(data)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch datasets catalog")
      )
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  return { entries, isLoading, error, refetch: fetchCatalog }
}
