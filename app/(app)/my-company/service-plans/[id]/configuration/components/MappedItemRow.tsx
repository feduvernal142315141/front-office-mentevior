"use client"

import { Pencil, Sliders, Trash2 } from "lucide-react"

import { Button } from "@/components/custom/Button"
import type { ServicePlanCategoryMappedItem } from "@/lib/types/company-service-plan.types"

import { DataCollectionBadge } from "@/app/(app)/my-company/service-plans/components/data-collection/DataCollectionBadge"

interface MappedItemRowProps {
  item: ServicePlanCategoryMappedItem
  isEditing: boolean
  editFormName: string
  isSavingEdit: boolean
  isDeleting: boolean
  isAnyDeleting: boolean
  onChangeEditName: (name: string) => void
  onStartEdit: (item: ServicePlanCategoryMappedItem) => void
  onCancelEdit: () => void
  onSaveEdit: (item: ServicePlanCategoryMappedItem) => void
  onDelete: (item: ServicePlanCategoryMappedItem) => void
  onConfigureDataCollection: (item: ServicePlanCategoryMappedItem) => void
}

export function MappedItemRow({
  item,
  isEditing,
  editFormName,
  isSavingEdit,
  isDeleting,
  isAnyDeleting,
  onChangeEditName,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onConfigureDataCollection,
}: MappedItemRowProps) {
  const containerClassName = isEditing
    ? `transition-opacity ${isDeleting ? "opacity-60" : ""}`
    : `rounded-xl border border-slate-200 bg-white px-4 py-3 transition-opacity ${isDeleting ? "opacity-60" : ""}`

  return (
    <div className={containerClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex w-full items-center gap-2">
              <input
                type="text"
                value={editFormName}
                onChange={(event) => onChangeEditName(event.target.value)}
                className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                disabled={isSavingEdit}
              />
              <Button
                type="button"
                className="h-8 px-3 text-xs"
                onClick={() => onSaveEdit(item)}
                disabled={editFormName.trim().length === 0 || isSavingEdit}
              >
                {isSavingEdit ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={onCancelEdit}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                {item.itemName}
                <DataCollectionBadge
                  hasConfig={item.hasDataCollection === true}
                  isCustomOverride={item.hasCustomDataCollection === true}
                />
              </p>
              {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              aria-label={`Configure Data Collection for ${item.itemName}`}
              onClick={() => onConfigureDataCollection(item)}
              disabled={isAnyDeleting || isSavingEdit}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Data Collection"
            >
              <Sliders className="h-4 w-4" />
            </button>
            {item.canEdit === true && (
              <button
                type="button"
                aria-label={`Edit ${item.itemName}`}
                onClick={() => onStartEdit(item)}
                disabled={isAnyDeleting || isSavingEdit}
                className="rounded-md p-1.5 text-[#2563EB] transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              aria-label={`Remove ${item.itemName} from category`}
              onClick={() => onDelete(item)}
              disabled={isAnyDeleting || isSavingEdit}
              className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
