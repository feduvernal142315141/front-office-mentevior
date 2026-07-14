"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"

import { AddItemsDrawer } from "../../service-plan/components/AddItemsDrawer"
import { CategoriesSidebar } from "../../service-plan/components/CategoriesSidebar"
import { CategoryItemsPanel } from "../../service-plan/components/CategoryItemsPanel"
import { ClientDataCollectionModal } from "./ClientDataCollectionModal"
import { ItemDetailPanel } from "./ItemDetailPanel"
import { useClientServicePlanCategoryItems } from "../../service-plan/hooks/useClientServicePlanCategoryItems"
import { useClientServicePlanConfiguration } from "../../service-plan/hooks/useClientServicePlanConfiguration"
import { useDataCollectionDrawerController } from "../../service-plan/hooks/useDataCollectionDrawerController"
import { useAlert } from "@/lib/contexts/alert-context"
import type { NavigateToItemRequest } from "./DataCollectionContent"

// State for the inline item detail panel
interface SelectedItemDetail {
  item: ClientServicePlanCategoryMappedItem
  categoryId: string
  categoryName: string
}

interface ServicePlanConfigViewProps {
  spId: string
  autoOpenItem?: NavigateToItemRequest | null
  onAutoOpenItemConsumed?: () => void
  onItemDirtyChange?: (dirty: boolean) => void
}

export function ServicePlanConfigView({ spId, autoOpenItem, onAutoOpenItemConsumed, onItemDirtyChange }: ServicePlanConfigViewProps) {
  const {
    clientServicePlan,
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    error,
    setActiveCategoryId,
    reloadCategories,
  } = useClientServicePlanConfiguration(spId)

  const itemsState = useClientServicePlanCategoryItems({
    activeClientServicePlanCategoryId: activeCategoryId,
    onCategoriesChanged: reloadCategories,
  })

  const dcDrawer = useDataCollectionDrawerController()
  const alert = useAlert()

  const [isAddItemsDrawerOpen, setIsAddItemsDrawerOpen] = useState(false)
  const [selectedItemDetail, setSelectedItemDetail] = useState<SelectedItemDetail | null>(null)
  const isItemDirtyRef = useRef(false)

  const handleItemDirtyChange = useCallback((dirty: boolean) => {
    isItemDirtyRef.current = dirty
    onItemDirtyChange?.(dirty)
  }, [onItemDirtyChange])

  const guardedAction = useCallback(
    (action: () => void) => {
      if (!isItemDirtyRef.current) {
        action()
        return
      }
      alert.confirm({
        title: "Unsaved Changes",
        description: "You have unsaved changes. Save them before leaving or discard to continue without saving.",
        confirmText: "Save",
        cancelText: "Cancel",
        onConfirm: () => {
          // Trigger the item form save programmatically
          const form = document.querySelector<HTMLFormElement>("form")
          form?.requestSubmit()
        },
        onCancel: () => {
          isItemDirtyRef.current = false
          onItemDirtyChange?.(false)
          action()
        },
      })
    },
    [alert, onItemDirtyChange]
  )

  // Guarded category selection
  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (!selectedItemDetail) {
        setActiveCategoryId(categoryId)
        return
      }
      guardedAction(() => {
        setSelectedItemDetail(null)
        setActiveCategoryId(categoryId)
      })
    },
    [selectedItemDetail, guardedAction, setActiveCategoryId]
  )

  // Clear item detail and dirty state when category changes
  useEffect(() => {
    setSelectedItemDetail(null)
    handleItemDirtyChange(false)
  }, [activeCategoryId, handleItemDirtyChange])

  // Auto-open item from Data Collection navigation
  useEffect(() => {
    if (!autoOpenItem || itemsState.isLoading) return

    // First, select the correct category
    if (activeCategoryId !== autoOpenItem.categoryId) {
      setActiveCategoryId(autoOpenItem.categoryId)
      return
    }

    // Then, once items are loaded for that category, open the item detail
    const targetItem = itemsState.items.find((i) => i.id === autoOpenItem.itemId)
    if (targetItem && activeCategory) {
      setSelectedItemDetail({
        item: targetItem,
        categoryId: autoOpenItem.categoryId,
        categoryName: activeCategory.categoryName,
      })
      onAutoOpenItemConsumed?.()
    }
  }, [autoOpenItem, activeCategoryId, itemsState.items, itemsState.isLoading, activeCategory, setActiveCategoryId, onAutoOpenItemConsumed])

  const mappedItemIds = useMemo(
    () => new Set(itemsState.items.map((item) => item.itemId)),
    [itemsState.items]
  )

  const handleOpenAddItemsDrawer = useCallback(() => {
    if (!activeCategory?.categoryId) return
    setIsAddItemsDrawerOpen(true)
  }, [activeCategory])

  const handleCloseAddItemsDrawer = useCallback(() => {
    setIsAddItemsDrawerOpen(false)
  }, [])

  const handleAssignSuccess = useCallback(async () => {
    await Promise.all([itemsState.reload(), reloadCategories()])
  }, [itemsState, reloadCategories])

  // Item DC click → open inline detail panel instead of modal
  const handleConfigureItemDc = useCallback(
    (item: ClientServicePlanCategoryMappedItem) => {
      if (!activeCategory || !activeCategoryId) return
      setSelectedItemDetail({
        item,
        categoryId: activeCategoryId,
        categoryName: activeCategory.categoryName,
      })
    },
    [activeCategory, activeCategoryId]
  )

  // Back from item detail → return to items list
  const handleItemDetailBack = useCallback(() => {
    setSelectedItemDetail(null)
    handleItemDirtyChange(false)
  }, [handleItemDirtyChange])

  // Item detail saved → reload and go back
  const handleItemDetailSaved = useCallback(() => {
    void itemsState.reload()
    void reloadCategories()
  }, [itemsState, reloadCategories])

  // Category DC still uses the modal
  const handleDcSaved = useCallback(() => {
    void itemsState.reload()
    void reloadCategories()
  }, [itemsState, reloadCategories])

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">Error loading configuration</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!clientServicePlan) return null

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <CategoriesSidebar
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            onConfigureDataCollection={dcDrawer.openForCategory}
          />

          {selectedItemDetail ? (
            <ItemDetailPanel
              categoryId={selectedItemDetail.categoryId}
              categoryName={selectedItemDetail.categoryName}
              clientServicePlanCategoryItemId={selectedItemDetail.item.id}
              itemName={selectedItemDetail.item.itemName}
              onBack={handleItemDetailBack}
              onSaved={handleItemDetailSaved}
              onDirtyChange={handleItemDirtyChange}
            />
          ) : (
            <CategoryItemsPanel
              activeCategory={activeCategory}
              items={itemsState.items}
              isLoading={itemsState.isLoading}
              error={itemsState.error}
              createForm={itemsState.createForm}
              deletingItemId={itemsState.deletingItemId}
              onDeleteItem={itemsState.deleteItem}
              onConfigureDataCollection={handleConfigureItemDc}
              onOpenAddItemsDrawer={handleOpenAddItemsDrawer}
            />
          )}
        </div>
      </div>

      {clientServicePlan && (
        <AddItemsDrawer
          open={isAddItemsDrawerOpen}
          onClose={handleCloseAddItemsDrawer}
          activeCategory={activeCategory}
          clientServicePlanId={clientServicePlan.id}
          mappedItemIds={mappedItemIds}
          onAssignSuccess={handleAssignSuccess}
        />
      )}

      {/* Modal only used for category-level data collection now */}
      <ClientDataCollectionModal
        open={dcDrawer.state.open}
        onClose={dcDrawer.close}
        mode={dcDrawer.state.mode}
        categoryId={dcDrawer.state.categoryId}
        categoryName={dcDrawer.state.categoryName}
        clientServicePlanCategoryItemId={dcDrawer.state.clientServicePlanCategoryItemId}
        itemName={dcDrawer.state.itemName}
        onSaved={handleDcSaved}
      />
    </>
  )
}
