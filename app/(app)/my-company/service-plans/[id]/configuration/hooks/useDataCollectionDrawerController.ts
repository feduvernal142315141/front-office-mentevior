"use client"

import { useCallback, useState } from "react"

import type {
  ServicePlanCategoryMappedItem,
  ServicePlanCategorySummary,
} from "@/lib/types/company-service-plan.types"

type DataCollectionDrawerMode = "category" | "item"

interface DataCollectionDrawerState {
  open: boolean
  mode: DataCollectionDrawerMode
  categoryId: string
  categoryName: string
  servicePlanCategoryItemId?: string
  itemName?: string
}

interface UseDataCollectionDrawerControllerResult {
  state: DataCollectionDrawerState
  openForCategory: (category: ServicePlanCategorySummary) => void
  openForItem: (
    item: ServicePlanCategoryMappedItem,
    categoryName: string,
    servicePlanCategoryId: string
  ) => void
  close: () => void
}

export function useDataCollectionDrawerController(): UseDataCollectionDrawerControllerResult {
  const [state, setState] = useState<DataCollectionDrawerState>({
    open: false,
    mode: "category",
    categoryId: "",
    categoryName: "",
    servicePlanCategoryItemId: undefined,
    itemName: undefined,
  })

  const openForCategory = useCallback((category: ServicePlanCategorySummary) => {
    setState({
      open: true,
      mode: "category",
      categoryId: category.id,
      categoryName: category.categoryName,
      servicePlanCategoryItemId: undefined,
      itemName: undefined,
    })
  }, [])

  const openForItem = useCallback(
    (
      item: ServicePlanCategoryMappedItem,
      categoryName: string,
      servicePlanCategoryId: string
    ) => {
      setState({
        open: true,
        mode: "item",
        categoryId: servicePlanCategoryId,
        categoryName,
        // `item.id` is the service-plan-category-item mapping row id, which is
        // what the backend `level` endpoint expects in its URL path.
        servicePlanCategoryItemId: item.id,
        itemName: item.itemName,
      })
    },
    []
  )

  const close = useCallback(() => {
    setState((current) => ({ ...current, open: false }))
  }, [])

  return { state, openForCategory, openForItem, close }
}
