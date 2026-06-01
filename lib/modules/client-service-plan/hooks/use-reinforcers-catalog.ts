"use client"

import { useCallback, useEffect, useState } from "react"

import {
  createReinforcer,
  deleteReinforcer,
  getReinforcersCatalog,
  updateReinforcer,
} from "@/lib/modules/client-service-plan/services/recommendation-catalogs.service"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"

interface UseReinforcersCatalogReturn {
  items: RecommendationCatalogItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  create: (name: string, group: string) => Promise<void>
  update: (id: string, name: string, group: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useReinforcersCatalog(): UseReinforcersCatalogReturn {
  const [items, setItems] = useState<RecommendationCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getReinforcersCatalog()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reinforcers catalog")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (name: string, group: string) => {
      await createReinforcer(name, group)
      await load()
    },
    [load]
  )

  const update = useCallback(
    async (id: string, name: string, group: string) => {
      await updateReinforcer(id, name, group)
      await load()
    },
    [load]
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteReinforcer(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  return { items, isLoading, error, reload: load, create, update, remove }
}
