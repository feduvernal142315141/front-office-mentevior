"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getCompanyServicePlanById,
  getServicePlanCategoriesByServicePlanId,
} from "@/lib/modules/service-plans/services/company-service-plans.service"
import type {
  CompanyServicePlan,
  ServicePlanCategorySummary,
} from "@/lib/types/company-service-plan.types"

interface UseServicePlanConfigurationResult {
  servicePlan: CompanyServicePlan | null
  categories: ServicePlanCategorySummary[]
  activeCategoryId: string | null
  activeCategory: ServicePlanCategorySummary | null
  isLoading: boolean
  error: string | null
  isEditModalOpen: boolean
  setActiveCategoryId: (id: string) => void
  reloadCategories: () => Promise<void>
  reloadServicePlan: () => Promise<void>
  openEditModal: () => void
  closeEditModal: () => void
  handleServicePlanUpdated: () => Promise<void>
}

function sortCategoriesByName(
  categories: ServicePlanCategorySummary[]
): ServicePlanCategorySummary[] {
  return [...categories].sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: "base" })
  )
}

export function useServicePlanConfiguration(servicePlanId: string): UseServicePlanConfigurationResult {
  const [servicePlan, setServicePlan] = useState<CompanyServicePlan | null>(null)
  const [categories, setCategories] = useState<ServicePlanCategorySummary[]>([])
  const [activeCategoryId, setActiveCategoryIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const reloadCategories = useCallback(async () => {
    const categoryData = await getServicePlanCategoriesByServicePlanId(servicePlanId)
    setCategories(sortCategoriesByName(categoryData))
  }, [servicePlanId])

  const reloadServicePlan = useCallback(async () => {
    const updatedPlan = await getCompanyServicePlanById(servicePlanId)
    if (updatedPlan) {
      setServicePlan(updatedPlan)
    }
  }, [servicePlanId])

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getCompanyServicePlanById(servicePlanId)
        if (!active) return

        if (!data) {
          setError("Service plan not found")
          return
        }

        setServicePlan(data)
        await reloadCategories()
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load service plan configuration")
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [reloadCategories, servicePlanId])

  useEffect(() => {
    if (!categories || categories.length === 0) {
      setActiveCategoryIdState(null)
      return
    }

    setActiveCategoryIdState((current) =>
      current && categories.some((category) => category.id === current)
        ? current
        : categories[0].id
    )
  }, [categories])

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId, categories]
  )

  const setActiveCategoryId = useCallback((id: string) => {
    setActiveCategoryIdState(id)
  }, [])

  const openEditModal = useCallback(() => setIsEditModalOpen(true), [])
  const closeEditModal = useCallback(() => setIsEditModalOpen(false), [])

  const handleServicePlanUpdated = useCallback(async () => {
    await reloadServicePlan()
    await reloadCategories()
    setIsEditModalOpen(false)
  }, [reloadCategories, reloadServicePlan])

  return {
    servicePlan,
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    error,
    isEditModalOpen,
    setActiveCategoryId,
    reloadCategories,
    reloadServicePlan,
    openEditModal,
    closeEditModal,
    handleServicePlanUpdated,
  }
}
