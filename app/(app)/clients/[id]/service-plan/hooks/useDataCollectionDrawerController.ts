"use client"

import { useCallback, useState } from "react"

import type {
  ClientServicePlanCategoryMappedItem,
  ClientServicePlanCategorySummary,
} from "@/lib/types/client-service-plan.types"

type DataCollectionDrawerMode = "category" | "item"

interface DataCollectionDrawerState {
  open: boolean
  mode: DataCollectionDrawerMode
  categoryId: string
  categoryName: string
  clientServicePlanCategoryItemId?: string
  itemName?: string
}

interface UseDataCollectionDrawerControllerResult {
  state: DataCollectionDrawerState
  openForCategory: (category: ClientServicePlanCategorySummary) => void
  openForItem: (
    item: ClientServicePlanCategoryMappedItem,
    categoryName: string,
    clientServicePlanCategoryId: string
  ) => void
  close: () => void
}

export function useDataCollectionDrawerController(): UseDataCollectionDrawerControllerResult {
  const [state, setState] = useState<DataCollectionDrawerState>({
    open: false,
    mode: "category",
    categoryId: "",
    categoryName: "",
    clientServicePlanCategoryItemId: undefined,
    itemName: undefined,
  })

  const openForCategory = useCallback((category: ClientServicePlanCategorySummary) => {
    setState({
      open: true,
      mode: "category",
      categoryId: category.id,
      categoryName: category.categoryName,
      clientServicePlanCategoryItemId: undefined,
      itemName: undefined,
    })
  }, [])

  const openForItem = useCallback(
    (
      item: ClientServicePlanCategoryMappedItem,
      categoryName: string,
      clientServicePlanCategoryId: string
    ) => {
      setState({
        open: true,
        mode: "item",
        categoryId: clientServicePlanCategoryId,
        categoryName,
        clientServicePlanCategoryItemId: item.id,
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
