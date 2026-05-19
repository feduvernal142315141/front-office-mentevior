"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import { CreateServicePlanModal } from "@/app/(app)/my-company/service-plans/components/CreateServicePlanModal"
import { DataCollectionDrawer } from "@/app/(app)/my-company/service-plans/components/data-collection/DataCollectionDrawer"
import { useCompanyActiveServices } from "@/lib/modules/services/hooks/use-company-active-services"
import type { ServicePlanCategoryMappedItem } from "@/lib/types/company-service-plan.types"

import { AddItemsDrawer } from "./components/AddItemsDrawer"
import { CategoriesSidebar } from "./components/CategoriesSidebar"
import { CategoryItemsPanel } from "./components/CategoryItemsPanel"
import { ServicePlanHeader } from "./components/ServicePlanHeader"
import { ServicePlanSummaryCard } from "./components/ServicePlanSummaryCard"
import { useDataCollectionDrawerController } from "./hooks/useDataCollectionDrawerController"
import { useServicePlanCategoryItems } from "./hooks/useServicePlanCategoryItems"
import { useServicePlanConfiguration } from "./hooks/useServicePlanConfiguration"

export default function ServicePlanConfigurationPage() {
  const params = useParams<{ id: string }>()
  const { services } = useCompanyActiveServices()

  const {
    servicePlan,
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    error,
    isEditModalOpen,
    setActiveCategoryId,
    reloadCategories,
    openEditModal,
    closeEditModal,
    handleServicePlanUpdated,
  } = useServicePlanConfiguration(params.id)

  const itemsState = useServicePlanCategoryItems({
    activeServicePlanCategoryId: activeCategoryId,
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
    (item: ServicePlanCategoryMappedItem) => {
      if (!activeCategory || !activeCategoryId) return
      dcDrawer.openForItem(item, activeCategory.categoryName, activeCategoryId)
    },
    [activeCategory, activeCategoryId, dcDrawer]
  )

  const handleDcSaved = useCallback(() => {
    void itemsState.reload()
    void reloadCategories()
  }, [itemsState, reloadCategories])

  const serviceLabel =
    servicePlan?.serviceName ||
    services.find((service) => service.id === servicePlan?.serviceId)?.name ||
    "-"

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <ServicePlanHeader />

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
        ) : servicePlan ? (
          <div className="space-y-6">
            <ServicePlanSummaryCard servicePlan={servicePlan} serviceLabel={serviceLabel} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <CategoriesSidebar
                categories={categories}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
                onEditServicePlan={openEditModal}
                onConfigureDataCollection={dcDrawer.openForCategory}
              />

              <CategoryItemsPanel
                activeCategory={activeCategory}
                items={itemsState.items}
                isLoading={itemsState.isLoading}
                error={itemsState.error}
                createForm={itemsState.createForm}
                editForm={itemsState.editForm}
                deletingItemId={itemsState.deletingItemId}
                onDeleteItem={itemsState.deleteItem}
                onConfigureDataCollection={handleConfigureItemDc}
                onOpenAddItemsDrawer={handleOpenAddItemsDrawer}
              />
            </div>
          </div>
        ) : null}
      </div>

      <CreateServicePlanModal
        open={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={() => {
          void handleServicePlanUpdated()
        }}
        initialPlan={servicePlan}
      />

      <AddItemsDrawer
        open={isAddItemsDrawerOpen}
        onClose={handleCloseAddItemsDrawer}
        activeCategory={activeCategory}
        mappedItemIds={mappedItemIds}
        onAssignSuccess={handleAssignSuccess}
      />

      <DataCollectionDrawer
        open={dcDrawer.state.open}
        onClose={dcDrawer.close}
        mode={dcDrawer.state.mode}
        categoryId={dcDrawer.state.categoryId}
        categoryName={dcDrawer.state.categoryName}
        servicePlanCategoryItemId={dcDrawer.state.servicePlanCategoryItemId}
        itemName={dcDrawer.state.itemName}
        servicePlanId={params.id}
        onSaved={handleDcSaved}
      />
    </div>
  )
}
