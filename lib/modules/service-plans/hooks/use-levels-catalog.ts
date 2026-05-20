"use client"

import { useCallback, useEffect, useState } from "react"

import { getLevelsCatalog } from "@/lib/modules/service-plans/services/levels-catalog.service"
import type { LevelsLibraryGroup } from "@/lib/types/data-collection.types"

interface UseLevelsCatalogReturn {
  groups: LevelsLibraryGroup[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useLevelsCatalog(enabled = true): UseLevelsCatalogReturn {
  const [groups, setGroups] = useState<LevelsLibraryGroup[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const fetchCatalog = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await getLevelsCatalog()
      setGroups(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch levels catalog"))
      setGroups([])
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  return { groups, isLoading, error, refetch: fetchCatalog }
}
