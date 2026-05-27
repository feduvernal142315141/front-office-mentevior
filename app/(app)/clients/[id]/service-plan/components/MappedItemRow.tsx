"use client"

import { Sliders, Trash2 } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { DataCollectionBadge } from "@/app/(app)/my-company/service-plans/components/data-collection/DataCollectionBadge"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"

interface MappedItemRowProps {
  item: ClientServicePlanCategoryMappedItem
  isDeleting: boolean
  isAnyDeleting: boolean
  onDelete: (item: ClientServicePlanCategoryMappedItem) => void
  onConfigureDataCollection: (item: ClientServicePlanCategoryMappedItem) => void
}

export function MappedItemRow({
  item,
  isDeleting,
  isAnyDeleting,
  onDelete,
  onConfigureDataCollection,
}: MappedItemRowProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 transition-opacity ${isDeleting ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
            {item.itemName}
            <DataCollectionBadge
              hasConfig={item.hasDataCollection === true}
              isCustomOverride={item.hasCustomDataCollection === true}
            />
          </p>
          {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label={`Configure Data Collection for ${item.itemName}`}
            onClick={() => onConfigureDataCollection(item)}
            disabled={isAnyDeleting}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="Data Collection"
          >
            <Sliders className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Remove ${item.itemName} from category`}
            onClick={() => onDelete(item)}
            disabled={isAnyDeleting}
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
