"use client"

import { ChevronRight, Sliders } from "lucide-react"

import { Card } from "@/components/custom/Card"
import { DataCollectionBadge } from "@/app/(app)/my-company/service-plans/components/data-collection/DataCollectionBadge"
import type { ClientServicePlanCategorySummary } from "@/lib/types/client-service-plan.types"

interface CategoriesSidebarProps {
  categories: ClientServicePlanCategorySummary[]
  activeCategoryId: string | null
  onSelectCategory: (id: string) => void
  onConfigureDataCollection: (category: ClientServicePlanCategorySummary) => void
}

export function CategoriesSidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  onConfigureDataCollection,
}: CategoriesSidebarProps) {
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Categories</h3>
      </div>

      {categories.length === 0 ? (
        <div className="px-4 py-6 text-sm text-slate-500">
          No categories mapped for this service plan.
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                title={category.categoryName}
                className={
                  isActive
                    ? "w-full flex items-center gap-2 rounded-xl bg-[#2563EB] px-3 py-3 text-left text-white shadow-sm"
                    : "w-full flex items-center gap-2 rounded-xl px-3 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                }
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                  <span className="min-w-0 flex-1 truncate font-medium">{category.categoryName}</span>
                  <span
                    className={
                      isActive
                        ? "shrink-0 text-sm font-medium tabular-nums text-white/80"
                        : "shrink-0 text-sm font-medium tabular-nums text-slate-500"
                    }
                  >
                    ({category.totalItems})
                  </span>
                  <DataCollectionBadge hasConfig={category.hasDataCollection === true} />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      onConfigureDataCollection(category)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation()
                        onConfigureDataCollection(category)
                      }
                    }}
                    title="Configure Data Collection"
                    className={
                      isActive
                        ? "rounded-md p-1 text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                        : "rounded-md p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    }
                  >
                    <Sliders className="h-4 w-4" />
                  </span>
                  <ChevronRight
                    className={isActive ? "h-4 w-4 text-white" : "h-4 w-4 text-slate-400"}
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
