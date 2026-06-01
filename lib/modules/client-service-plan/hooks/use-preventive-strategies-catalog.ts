"use client"

import { useCallback, useEffect, useState } from "react"

import {
  createPreventiveStrategy,
  deletePreventiveStrategy,
  getPreventiveStrategiesCatalog,
  updatePreventiveStrategy,
} from "@/lib/modules/client-service-plan/services/recommendation-catalogs.service"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"

interface UsePreventiveStrategiesCatalogReturn {
  items: RecommendationCatalogItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  create: (name: string) => Promise<string>
  update: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function usePreventiveStrategiesCatalog(): UsePreventiveStrategiesCatalogReturn {
  const [items, setItems] = useState<RecommendationCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getPreventiveStrategiesCatalog()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preventive strategies catalog")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (name: string) => {
      const id = await createPreventiveStrategy(name)
      await load()
      return id
    },
    [load]
  )

  const update = useCallback(
    async (id: string, name: string) => {
      await updatePreventiveStrategy(id, name)
      await load()
    },
    [load]
  )

  const remove = useCallback(
    async (id: string) => {
      await deletePreventiveStrategy(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  return { items, isLoading, error, reload: load, create, update, remove }
}
