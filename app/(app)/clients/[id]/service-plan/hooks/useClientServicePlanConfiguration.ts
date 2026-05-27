"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getClientServicePlanByClientId,
  getClientServicePlanCategories,
} from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import type {
  ClientServicePlan,
  ClientServicePlanCategorySummary,
} from "@/lib/types/client-service-plan.types"

interface UseClientServicePlanConfigurationResult {
  clientServicePlan: ClientServicePlan | null
  categories: ClientServicePlanCategorySummary[]
  activeCategoryId: string | null
  activeCategory: ClientServicePlanCategorySummary | null
  isLoading: boolean
  error: string | null
  setActiveCategoryId: (id: string) => void
  reloadCategories: () => Promise<void>
  reloadClientServicePlan: () => Promise<void>
}

function sortCategoriesByName(
  categories: ClientServicePlanCategorySummary[]
): ClientServicePlanCategorySummary[] {
  return [...categories].sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: "base" })
  )
}

export function useClientServicePlanConfiguration(
  clientId: string
): UseClientServicePlanConfigurationResult {
  const [clientServicePlan, setClientServicePlan] = useState<ClientServicePlan | null>(null)
  const [categories, setCategories] = useState<ClientServicePlanCategorySummary[]>([])
  const [activeCategoryId, setActiveCategoryIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reloadCategories = useCallback(async () => {
    if (!clientServicePlan?.id) return
    const categoryData = await getClientServicePlanCategories(clientServicePlan.id)
    setCategories(sortCategoriesByName(categoryData))
  }, [clientServicePlan?.id])

  const reloadClientServicePlan = useCallback(async () => {
    if (!clientId) return
    const updated = await getClientServicePlanByClientId(clientId)
    if (updated) setClientServicePlan(updated)
  }, [clientId])

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setIsLoading(true)
        setError(null)

        const plan = await getClientServicePlanByClientId(clientId)
        if (!active) return

        if (!plan) {
          setError("Client service plan not found")
          return
        }

        setClientServicePlan(plan)

        const categoryData = await getClientServicePlanCategories(plan.id)
        if (!active) return
        setCategories(sortCategoriesByName(categoryData))
      } catch (err) {
        if (!active) return
        setError(
          err instanceof Error ? err.message : "Failed to load client service plan configuration"
        )
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [clientId])

  useEffect(() => {
    if (!categories || categories.length === 0) {
      setActiveCategoryIdState(null)
      return
    }
    setActiveCategoryIdState((current) =>
      current && categories.some((cat) => cat.id === current)
        ? current
        : categories[0].id
    )
  }, [categories])

  const activeCategory = useMemo(
    () => categories.find((cat) => cat.id === activeCategoryId) ?? null,
    [activeCategoryId, categories]
  )

  const setActiveCategoryId = useCallback((id: string) => {
    setActiveCategoryIdState(id)
  }, [])

  return {
    clientServicePlan,
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    error,
    setActiveCategoryId,
    reloadCategories,
    reloadClientServicePlan,
  }
}
