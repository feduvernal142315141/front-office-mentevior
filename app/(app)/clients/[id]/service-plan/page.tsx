"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"

import { AddItemsDrawer } from "./components/AddItemsDrawer"
import { CategoriesSidebar } from "./components/CategoriesSidebar"
import { CategoryItemsPanel } from "./components/CategoryItemsPanel"
import { ClientServicePlanHeader } from "./components/ClientServicePlanHeader"
import { ClientServicePlanSummaryCard } from "./components/ClientServicePlanSummaryCard"
import { useClientServicePlanCategoryItems } from "./hooks/useClientServicePlanCategoryItems"
import { useClientServicePlanConfiguration } from "./hooks/useClientServicePlanConfiguration"
import { useDataCollectionDrawerController } from "./hooks/useDataCollectionDrawerController"

export default function ClientServicePlanPage() {
  const params = useParams<{ id: string }>()
  const clientId = params.id

  const {
    clientServicePlan,
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    error,
    setActiveCategoryId,
    reloadCategories,
  } = useClientServicePlanConfiguration(clientId)

  const itemsState = useClientServicePlanCategoryItems({
    activeClientServicePlanCategoryId: activeCategoryId,
    onCategoriesChanged: reloadCategories,
  })

  const dcDrawer = useDataCollectionDrawerController()

  const [isAddItemsDrawerOpen, setIsAddItemsDrawerOpen] = useState(false)

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

  const handleConfigureItemDc = useCallback(
    (item: ClientServicePlanCategoryMappedItem) => {
      if (!activeCategory || !activeCategoryId) return
      dcDrawer.openForItem(item, activeCategory.categoryName, activeCategoryId)
    },
    [activeCategory, activeCategoryId, dcDrawer]
  )

  const handleDcSaved = useCallback(() => {
    void itemsState.reload()
    void reloadCategories()
  }, [itemsState, reloadCategories])

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <ClientServicePlanHeader />

        {isLoading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-700">Error loading configuration</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        ) : clientServicePlan ? (
          <div className="space-y-6">
            <ClientServicePlanSummaryCard clientServicePlan={clientServicePlan} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <CategoriesSidebar
                categories={categories}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
                onConfigureDataCollection={dcDrawer.openForCategory}
              />

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
            </div>
          </div>
        ) : null}
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

      {/* ClientDataCollectionDrawer se agrega en Paso 6-8 (Fase 2) */}
    </div>
  )
}
