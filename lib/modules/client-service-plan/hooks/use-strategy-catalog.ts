"use client"

import { useCallback, useEffect, useState } from "react"

import { getStrategyCatalog } from "@/lib/modules/client-service-plan/services/recommendation-catalogs.service"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"

interface UseStrategyCatalogReturn {
  items: RecommendationCatalogItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useStrategyCatalog(): UseStrategyCatalogReturn {
  const [items, setItems] = useState<RecommendationCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getStrategyCatalog()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load strategy catalog")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, isLoading, error, reload: load }
}
