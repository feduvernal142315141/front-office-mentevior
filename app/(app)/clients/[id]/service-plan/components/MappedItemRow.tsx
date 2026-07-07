"use client"

import { useMemo, useState } from "react"
import { Sliders, Trash2 } from "lucide-react"
import { format } from "date-fns"

import { DataCollectionBadge } from "@/app/(app)/my-company/service-plans/components/data-collection/DataCollectionBadge"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"

function parseLocalDate(iso: string): Date {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return new Date(iso)
}

interface MappedItemRowProps {
  item: ClientServicePlanCategoryMappedItem
  isDeleting: boolean
  isAnyDeleting: boolean
  onDelete: (item: ClientServicePlanCategoryMappedItem) => void
  onConfigureDataCollection: (item: ClientServicePlanCategoryMappedItem) => void
  teachingMethodName?: string
  typeName?: string
}

export function MappedItemRow({
  item,
  isDeleting,
  isAnyDeleting,
  onDelete,
  onConfigureDataCollection,
  teachingMethodName,
  typeName,
}: MappedItemRowProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const baselines = useMemo(() => {
    if (!item.baseline || item.baseline.length === 0) return []
    return [...item.baseline]
      .filter((b) => b.date)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
  }, [item.baseline])

  const inProgressObjectiveNumber = useMemo(() => {
    if (!item.objetive || item.objetive.length === 0) return null
    const withDates = item.objetive.filter((o) => o.startDate)
    if (withDates.length === 0) return null
    const sorted = [...withDates].sort((a, b) =>
      parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime()
    )
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    // Mastered = has endDate; In progress = startDate <= today and no endDate
    for (let i = 0; i < sorted.length; i++) {
      const obj = sorted[i]
      if (obj.endDate) continue // mastered, skip
      const start = parseLocalDate(obj.startDate)
      if (start.getTime() <= now.getTime()) {
        return i + 1
      }
    }
    return null
  }, [item.objetive])

  return (
    <div
      className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-opacity ${isDeleting ? "opacity-60" : ""}`}
    >
      {/* Item Name */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 flex items-center gap-2 truncate">
          {item.itemName}
          <DataCollectionBadge
            hasConfig={item.hasDataCollection === true}
            isCustomOverride={item.hasCustomDataCollection === true}
          />
        </p>
        {item.description && (
          <p className="mt-0.5 text-xs text-slate-500 truncate">{item.description}</p>
        )}
      </div>

      {/* Teaching Method */}
      <div className="min-w-0">
        {teachingMethodName ? (
          <span className="text-sm text-slate-700 truncate block">{teachingMethodName}</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Type Data Collection */}
      <div className="min-w-0">
        {typeName ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 truncate max-w-full">
            {typeName}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Baseline */}
      <div className="min-w-0">
        {baselines.length > 0 ? (
          <div className="space-y-0.5">
            {baselines.map((bl) => (
              <p key={bl.id} className="text-xs text-slate-600 tabular-nums">
                <span className="font-medium">{format(parseLocalDate(bl.date), "MM/dd")}</span>
                <span className="text-slate-400 mx-1">:</span>
                <span className="font-semibold text-slate-800">{bl.value}</span>
              </p>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Objective */}
      <div className="min-w-0">
        {inProgressObjectiveNumber !== null ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            STO #{inProgressObjectiveNumber}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Actions */}
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
          onClick={() => setShowDeleteModal(true)}
          disabled={isAnyDeleting}
          className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false)
          onDelete(item)
        }}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        itemName={item.itemName}
        isDeleting={isDeleting}
      />
    </div>
  )
}
