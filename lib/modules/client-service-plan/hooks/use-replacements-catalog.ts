"use client"

import { useCallback, useEffect, useState } from "react"

import { getReplacementsCatalog } from "@/lib/modules/client-service-plan/services/recommendation-catalogs.service"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"

interface UseReplacementsCatalogReturn {
  items: RecommendationCatalogItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useReplacementsCatalog(): UseReplacementsCatalogReturn {
  const [items, setItems] = useState<RecommendationCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getReplacementsCatalog()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load replacements catalog")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, isLoading, error, reload: load }
}
