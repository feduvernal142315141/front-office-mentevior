"use client"

import { Button } from "@/components/custom/Button"
import { Card } from "@/components/custom/Card"
import type {
  ClientServicePlanCategoryMappedItem,
  ClientServicePlanCategorySummary,
} from "@/lib/types/client-service-plan.types"

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
  deletingItemId,
  onDeleteItem,
  onConfigureDataCollection,
  onOpenAddItemsDrawer,
}: CategoryItemsPanelProps) {
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
        <Button type="button" className="h-9 px-4 text-xs" onClick={onOpenAddItemsDrawer}>
          Add items
        </Button>
      </div>

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
          <div className="space-y-3">
            {items.map((item) => (
              <MappedItemRow
                key={item.id}
                item={item}
                isDeleting={deletingItemId === item.id}
                isAnyDeleting={deletingItemId !== null}
                onDelete={onDeleteItem}
                onConfigureDataCollection={onConfigureDataCollection}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
