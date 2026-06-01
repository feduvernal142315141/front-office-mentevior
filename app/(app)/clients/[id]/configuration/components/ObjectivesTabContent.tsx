"use client"

import { useCallback, useMemo, useState } from "react"
import { Plus, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

import { Button } from "@/components/custom/Button"
import { Badge } from "@/components/ui/badge"
import {
  OPERATOR_SMART_CRITERIA_OPTIONS,
  type ObjectiveStatus,
} from "@/lib/types/data-collection.types"

import {
  ObjectiveFormModal,
  createEmptyObjective,
  type ObjectiveRow,
} from "./ObjectiveFormModal"

interface ObjectivesTabContentProps {
  objectives: ObjectiveRow[]
  onChange: (objectives: ObjectiveRow[]) => void
  mode: "category" | "item"
  periodMap: Map<string, string>
  periodSelectOptions: { value: string; label: string }[]
}

function computeStatus(obj: ObjectiveRow): ObjectiveStatus {
  if (obj.endDate) return "mastered"
  if (!obj.startDate) return "not_started"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(obj.startDate)
  start.setHours(0, 0, 0, 0)
  if (start > today) return "not_started"
  return "in_progress"
}

const STATUS_CONFIG: Record<ObjectiveStatus, { label: string; className: string }> = {
  not_started: {
    label: "Not started",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  in_progress: {
    label: "In progress",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  mastered: {
    label: "Mastered",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    return format(d, "MM/dd/yyyy")
  } catch {
    return dateStr
  }
}

export function ObjectivesTabContent({
  objectives,
  onChange,
  mode,
  periodMap,
  periodSelectOptions,
}: ObjectivesTabContentProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingObjective, setEditingObjective] = useState<ObjectiveRow | null>(null)

  const handleAdd = useCallback(() => {
    setEditingObjective(null)
    setFormOpen(true)
  }, [])

  const handleRowClick = useCallback((obj: ObjectiveRow) => {
    setEditingObjective(obj)
    setFormOpen(true)
  }, [])

  const handleSave = useCallback(
    (saved: ObjectiveRow) => {
      const exists = objectives.some((o) => o.localId === saved.localId)
      if (exists) {
        onChange(objectives.map((o) => (o.localId === saved.localId ? saved : o)))
      } else {
        onChange([...objectives, saved])
      }
    },
    [objectives, onChange]
  )

  const handleDelete = useCallback(
    (deleted: ObjectiveRow) => {
      onChange(objectives.filter((o) => o.localId !== deleted.localId))
    },
    [objectives, onChange]
  )

  const getSmartCriteriaSummary = useCallback(
    (obj: ObjectiveRow): string => {
      const op = OPERATOR_SMART_CRITERIA_OPTIONS.find(
        (o) => o.value === obj.operatorSmartCriteria
      )?.label ?? obj.operatorSmartCriteria
      const period = periodMap.get(obj.periodSmartCriteriaCatalogId) ?? ""
      const durPeriod = periodMap.get(obj.periodDurationCatalogId) ?? ""
      const parts: string[] = []
      if (op && obj.valueSmartCriteria) parts.push(`${op} ${obj.valueSmartCriteria}`)
      if (period) parts.push(`per ${period.toLowerCase()}`)
      if (obj.valueDuration && durPeriod) parts.push(`for ${obj.valueDuration} ${durPeriod.toLowerCase()}s`)
      return parts.length > 0 ? parts.join(" ") : ""
    },
    [periodMap]
  )

  return (
    <>
      <div className="space-y-5 pb-2">
        {objectives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
            <Target className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">No objectives configured yet.</p>
            <p className="text-xs text-slate-500 mt-1">Click the button below to add one.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Date</span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Est. End Date</span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">End Date</span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Status</span>
            </div>

            {/* Rows */}
            {objectives.map((obj) => {
              const status = computeStatus(obj)
              const statusCfg = STATUS_CONFIG[status]
              const smartSummary = getSmartCriteriaSummary(obj)

              return (
                <button
                  key={obj.localId}
                  type="button"
                  onClick={() => handleRowClick(obj)}
                  className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 items-center px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors w-full text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{obj.name || "Untitled"}</p>
                    {smartSummary && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        <span className="font-semibold">Smart Criteria:</span> {smartSummary}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 tabular-nums">{formatDate(obj.startDate)}</span>
                  <span className="text-xs text-slate-600 tabular-nums">{formatDate(obj.estimatedEndDate)}</span>
                  <span className="text-xs text-slate-600 tabular-nums">{formatDate(obj.endDate)}</span>
                  <div className="flex justify-end">
                    <Badge
                      variant="outline"
                      className={cn("text-[11px] whitespace-nowrap", statusCfg.className)}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Add button */}
        <div className="flex justify-center pt-1">
          <Button type="button" onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add objective
          </Button>
        </div>
      </div>

      <ObjectiveFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        objective={editingObjective}
        mode={mode}
        onSave={handleSave}
        onDelete={handleDelete}
        periodSelectOptions={periodSelectOptions}
      />
    </>
  )
}
