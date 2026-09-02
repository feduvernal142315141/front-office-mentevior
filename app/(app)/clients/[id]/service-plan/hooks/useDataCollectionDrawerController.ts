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
  /** Fila de client-service-plan-category (única por plan del cliente) */
  categoryId: string
  /** Id del catálogo global de categorías */
  categoryCatalogId: string
  categoryName: string
  clientServicePlanCategoryItemId?: string
  itemName?: string
}

interface UseDataCollectionDrawerControllerResult {
  state: DataCollectionDrawerState
  openForCategory: (category: ClientServicePlanCategorySummary) => void
  openForItem: (
    item: ClientServicePlanCategoryMappedItem,
    category: ClientServicePlanCategorySummary
  ) => void
  close: () => void
}

export function useDataCollectionDrawerController(): UseDataCollectionDrawerControllerResult {
  const [state, setState] = useState<DataCollectionDrawerState>({
    open: false,
    mode: "category",
    categoryId: "",
    categoryCatalogId: "",
    categoryName: "",
    clientServicePlanCategoryItemId: undefined,
    itemName: undefined,
  })

  const openForCategory = useCallback((category: ClientServicePlanCategorySummary) => {
    setState({
      open: true,
      mode: "category",
      categoryId: category.id,
      categoryCatalogId: category.categoryId,
      categoryName: category.categoryName,
      clientServicePlanCategoryItemId: undefined,
      itemName: undefined,
    })
  }, [])

  const openForItem = useCallback(
    (
      item: ClientServicePlanCategoryMappedItem,
      category: ClientServicePlanCategorySummary
    ) => {
      setState({
        open: true,
        mode: "item",
        categoryId: category.id,
        categoryCatalogId: category.categoryId,
        categoryName: category.categoryName,
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
