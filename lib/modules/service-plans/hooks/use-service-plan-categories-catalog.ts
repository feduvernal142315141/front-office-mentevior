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
  createCategory: (name: string) => Promise<string | null>
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

  return sortCategoryOptions(Array.from(map.values()))
}

function sortCategoryOptions(
  options: ServicePlanCategoryCatalogOption[]
): ServicePlanCategoryCatalogOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
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
        const sortedData = sortCategoryOptions(data)
        cachedOptions = sortedData
        cachedUsingFallback = false
        setOptions(sortedData)
        return
      }

      setUsingFallback(true)
      const sortedFallback = sortCategoryOptions(SERVICE_PLAN_CATEGORY_OPTIONS)
      setOptions(sortedFallback)
      cachedOptions = sortedFallback
      cachedUsingFallback = true
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load categories catalog"))
      setUsingFallback(true)
      const sortedFallback = sortCategoryOptions(SERVICE_PLAN_CATEGORY_OPTIONS)
      setOptions(sortedFallback)
      cachedOptions = sortedFallback
      cachedUsingFallback = true
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCatalog(false)
  }, [refreshCatalog])

  const createCategory = async (name: string): Promise<string | null> => {
    const normalizedName = name.trim()

    if (normalizedName.length === 0) return null

    try {
      setIsCreating(true)
      const created = await createServicePlanCategory(normalizedName)
      const createdValue = created.option.value

      setOptions((current) => {
        const merged = mergeCategoryOptions(current, [created.option])
        cachedOptions = merged
        return merged
      })

      await refreshCatalog(true)

      const canonicalValue =
        cachedOptions?.find(
          (option) => option.label.trim().toLowerCase() === normalizedName.toLowerCase()
        )?.value ?? createdValue

      if (created.usedFallback) {
        setUsingFallback(true)
      }

      return canonicalValue
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to create category"))
      return null
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
