"use client"

import { useMemo } from "react"
import { Button } from "@/components/custom/Button"
import { Card } from "@/components/custom/Card"
import type {
  ClientServicePlanCategoryMappedItem,
  ClientServicePlanCategorySummary,
} from "@/lib/types/client-service-plan.types"
import { useTeachingMethodCatalog } from "@/lib/modules/client-service-plan/hooks/use-teaching-method-catalog"
import { useTypeEventCatalog } from "@/lib/modules/service-plans/hooks/use-type-event-catalog"

import { CreateItemInlineForm } from "./CreateItemInlineForm"
import { MappedItemRow } from "./MappedItemRow"

interface CreateInlineFormState {
  visible: boolean
  name: string
  isSaving: boolean
  start: () => void
  cancel: () => void
  setName: (name: string) => void
  save: () => void
}

interface CategoryItemsPanelProps {
  activeCategory: ClientServicePlanCategorySummary | null
  items: ClientServicePlanCategoryMappedItem[]
  isLoading: boolean
  error: string | null
  createForm: CreateInlineFormState
  deletingItemId: string | null
  onDeleteItem: (item: ClientServicePlanCategoryMappedItem) => void
  onConfigureDataCollection: (item: ClientServicePlanCategoryMappedItem) => void
  onOpenAddItemsDrawer: () => void
}

export function CategoryItemsPanel({
  activeCategory,
  items,
  isLoading,
  error,
  createForm,
  deletingItemId,
  onDeleteItem,
  onConfigureDataCollection,
  onOpenAddItemsDrawer,
}: CategoryItemsPanelProps) {
  const { items: teachingMethods } = useTeachingMethodCatalog()
  const { itemsMap: typeEventMap } = useTypeEventCatalog()

  const teachingMethodMap = useMemo(
    () => new Map(teachingMethods.map((tm) => [tm.id, tm.name])),
    [teachingMethods]
  )

  if (!activeCategory) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6">
          <p className="text-sm text-slate-600">Select a category to view its items.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="elevated" padding="lg">
      <h3 className="text-base font-semibold text-slate-900">
        {`${activeCategory.categoryName} (${activeCategory.totalItems})`}
      </h3>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Mapped items for this category.</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-4 text-xs"
            onClick={createForm.start}
            disabled={createForm.isSaving}
          >
            Create item
          </Button>
          <Button type="button" className="h-9 px-4 text-xs" onClick={onOpenAddItemsDrawer}>
            Add items
          </Button>
        </div>
      </div>

      {createForm.visible && (
        <CreateItemInlineForm
          name={createForm.name}
          isSaving={createForm.isSaving}
          onChangeName={createForm.setName}
          onCancel={createForm.cancel}
          onSave={createForm.save}
        />
      )}

      <div className="mt-5">
        {isLoading ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">Could not load category items.</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6">
            <p className="text-sm text-slate-600">No items mapped for this category.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Column Headers */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Item</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Teaching Method</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Type</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Baseline</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Objective</span>
              {/* Spacer for actions column */}
              <span className="w-[68px]" />
            </div>
            {items.map((item) => {
              const tmName = item.teachingMethodId ? teachingMethodMap.get(item.teachingMethodId) : undefined
              const typeId = item.dataCollection?.typeEventCatalogId
              const tName = typeId ? typeEventMap.get(typeId)?.name : undefined
              return (
                <MappedItemRow
                  key={item.id}
                  item={item}
                  isDeleting={deletingItemId === item.id}
                  isAnyDeleting={deletingItemId !== null}
                  onDelete={onDeleteItem}
                  onConfigureDataCollection={onConfigureDataCollection}
                  teachingMethodName={tmName}
                  typeName={tName}
                />
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
