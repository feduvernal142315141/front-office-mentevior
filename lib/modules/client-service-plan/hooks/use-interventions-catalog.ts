"use client"

import { useCallback, useEffect, useState } from "react"

import {
  createIntervention,
  deleteIntervention,
  getInterventionsCatalog,
  updateIntervention,
} from "@/lib/modules/client-service-plan/services/recommendation-catalogs.service"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"

interface UseInterventionsCatalogReturn {
  items: RecommendationCatalogItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  create: (name: string) => Promise<string>
  update: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useInterventionsCatalog(): UseInterventionsCatalogReturn {
  const [items, setItems] = useState<RecommendationCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getInterventionsCatalog()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interventions catalog")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (name: string) => {
      const id = await createIntervention(name)
      await load()
      return id
    },
    [load]
  )

  const update = useCallback(
    async (id: string, name: string) => {
      await updateIntervention(id, name)
      await load()
    },
    [load]
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteIntervention(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  return { items, isLoading, error, reload: load, create, update, remove }
}
