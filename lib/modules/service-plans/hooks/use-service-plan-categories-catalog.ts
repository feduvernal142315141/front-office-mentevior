"use client"

import { useCallback, useEffect, useState } from "react"
import { SERVICE_PLAN_CATEGORY_OPTIONS } from "@/lib/modules/service-plans/constants/service-plan-categories"
import {
  createServicePlanCategory,
  getServicePlanCategoriesCatalog,
  type ServicePlanCategoryCatalogOption,
} from "../services/service-plan-categories-catalog.service"

interface UseServicePlanCategoriesCatalogReturn {
  options: ServicePlanCategoryCatalogOption[]
  isLoading: boolean
  isCreating: boolean
  error: Error | null
  usingFallback: boolean
  createCategory: (name: string) => Promise<boolean>
  refreshCatalog: (force?: boolean) => Promise<void>
}

let cachedOptions: ServicePlanCategoryCatalogOption[] | null = null
let cachedUsingFallback = false
let inflightCatalogRequest: Promise<ServicePlanCategoryCatalogOption[]> | null = null

function getOptionDedupeKey(option: ServicePlanCategoryCatalogOption): string {
  const labelKey = option.label.trim().toLowerCase()
  if (labelKey.length > 0) return `label:${labelKey}`
  return `value:${option.value.trim().toLowerCase()}`
}

function mergeCategoryOptions(
  current: ServicePlanCategoryCatalogOption[],
  incoming: ServicePlanCategoryCatalogOption[]
): ServicePlanCategoryCatalogOption[] {
  const map = new Map<string, ServicePlanCategoryCatalogOption>()

  current.forEach((option) => {
    const dedupeKey = getOptionDedupeKey(option)
    map.set(dedupeKey, option)
  })

  incoming.forEach((option) => {
    const dedupeKey = getOptionDedupeKey(option)
    map.set(dedupeKey, option)
  })

  return Array.from(map.values())
}

export function useServicePlanCategoriesCatalog(): UseServicePlanCategoriesCatalogReturn {
  const [options, setOptions] = useState<ServicePlanCategoryCatalogOption[]>(
    SERVICE_PLAN_CATEGORY_OPTIONS
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const refreshCatalog = useCallback(async (force = false): Promise<void> => {
    if (!force && cachedOptions && cachedOptions.length > 0) {
      setOptions(cachedOptions)
      setUsingFallback(cachedUsingFallback)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setUsingFallback(false)

      if (!inflightCatalogRequest || force) {
        inflightCatalogRequest = getServicePlanCategoriesCatalog().finally(() => {
          inflightCatalogRequest = null
        })
      }

      const data = await inflightCatalogRequest!

      if (data.length > 0) {
        const merged = mergeCategoryOptions(SERVICE_PLAN_CATEGORY_OPTIONS, data)
        cachedOptions = merged
        cachedUsingFallback = false
        setOptions(merged)
        return
      }

      setUsingFallback(true)
      setOptions(SERVICE_PLAN_CATEGORY_OPTIONS)
      cachedOptions = SERVICE_PLAN_CATEGORY_OPTIONS
      cachedUsingFallback = true
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load categories catalog"))
      setUsingFallback(true)
      setOptions(SERVICE_PLAN_CATEGORY_OPTIONS)
      cachedOptions = SERVICE_PLAN_CATEGORY_OPTIONS
      cachedUsingFallback = true
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCatalog(false)
  }, [refreshCatalog])

  const createCategory = async (name: string): Promise<boolean> => {
    const normalizedName = name.trim()

    if (normalizedName.length === 0) return false

    try {
      setIsCreating(true)
      const created = await createServicePlanCategory(normalizedName)

      setOptions((current) => {
        const merged = mergeCategoryOptions(current, [created.option])
        cachedOptions = merged
        return merged
      })

      void refreshCatalog(true)

      if (created.usedFallback) {
        setUsingFallback(true)
      }

      return true
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to create category"))
      return false
    } finally {
      setIsCreating(false)
    }
  }

  return {
    options,
    isLoading,
    isCreating,
    error,
    usingFallback,
    createCategory,
    refreshCatalog,
  }
}
