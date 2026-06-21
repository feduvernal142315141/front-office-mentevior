"use client"

import { useCallback, useMemo, useState } from "react"
import { Plus, Sparkles, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { parseLocalDate } from "@/lib/date"

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
import { GenerateObjectivesModal } from "./GenerateObjectivesModal"

interface ObjectivesTabContentProps {
  objectives: ObjectiveRow[]
  onChange: (objectives: ObjectiveRow[]) => void
  mode: "category" | "item"
  periodMap: Map<string, string>
  periodSelectOptions: { value: string; label: string }[]
  clientFirstName?: string
  targetName?: string
  dataCollectionTypeName?: string
}

function computeStatus(obj: ObjectiveRow): ObjectiveStatus {
  if (obj.endDate) return "mastered"
  if (!obj.startDate) return "not_started"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = parseLocalDate(obj.startDate)
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
    return format(parseLocalDate(dateStr), "MM/dd/yyyy")
  } catch {
    return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr
  }
}

const HEADER_CLASS = "text-[10px] font-medium text-slate-500 uppercase tracking-wide"
const DATE_COL_WIDTH = "84px"
const STATUS_COL_WIDTH = "88px"

export function ObjectivesTabContent({
  objectives,
  onChange,
  mode,
  periodMap,
  periodSelectOptions,
  clientFirstName,
  targetName,
  dataCollectionTypeName,
}: ObjectivesTabContentProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
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

  const handleGenerate = useCallback(
    (generated: ObjectiveRow[]) => {
      onChange([...objectives, ...generated])
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

  const showStartDate = useMemo(
    () => objectives.some((o) => o.startDate),
    [objectives]
  )
  const showEstEndDate = useMemo(
    () => objectives.some((o) => o.estimatedEndDate),
    [objectives]
  )
  const showEndDate = useMemo(
    () => objectives.some((o) => o.endDate),
    [objectives]
  )

  const gridTemplateColumns = useMemo(() => {
    const cols = ["minmax(0,1fr)"]
    if (showStartDate) cols.push(DATE_COL_WIDTH)
    if (showEstEndDate) cols.push(DATE_COL_WIDTH)
    if (showEndDate) cols.push(DATE_COL_WIDTH)
    cols.push(STATUS_COL_WIDTH)
    return cols.join(" ")
  }, [showStartDate, showEstEndDate, showEndDate])

  return (
    <>
      <div className="flex flex-col gap-3">
        {objectives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
            <Target className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">No objectives configured yet.</p>
            <p className="text-xs text-slate-500 mt-1">Click the button below to add one.</p>
          </div>
        ) : (
          <div className="relative rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="max-h-[clamp(180px,40vh,520px)] overflow-y-auto custom-scrollbar overscroll-contain">
              <div
                className="sticky top-0 z-10 grid gap-2 px-4 py-2.5 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200"
                style={{ gridTemplateColumns }}
              >
                <span className={HEADER_CLASS}>Name</span>
                {showStartDate && <span className={HEADER_CLASS}>Start Date</span>}
                {showEstEndDate && <span className={HEADER_CLASS}>Est. End Date</span>}
                {showEndDate && <span className={HEADER_CLASS}>End Date</span>}
                <span className={cn(HEADER_CLASS, "text-right")}>Status</span>
              </div>

              {objectives.map((obj) => {
                const status = computeStatus(obj)
                const statusCfg = STATUS_CONFIG[status]
                const smartSummary = getSmartCriteriaSummary(obj)

                return (
                  <button
                    key={obj.localId}
                    type="button"
                    onClick={() => handleRowClick(obj)}
                    className="grid gap-2 items-start px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors w-full text-left"
                    style={{ gridTemplateColumns }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 whitespace-normal break-words leading-snug">
                        {obj.name || "Untitled"}
                      </p>
                      {smartSummary && (
                        <p className="text-xs text-slate-500 whitespace-normal break-words mt-1 leading-snug">
                          <span className="font-semibold">Smart Criteria:</span> {smartSummary}
                        </p>
                      )}
                    </div>
                    {showStartDate && (
                      <span className="text-xs text-slate-600 tabular-nums pt-0.5">
                        {formatDate(obj.startDate)}
                      </span>
                    )}
                    {showEstEndDate && (
                      <span className="text-xs text-slate-600 tabular-nums pt-0.5">
                        {formatDate(obj.estimatedEndDate)}
                      </span>
                    )}
                    {showEndDate && (
                      <span className="text-xs text-slate-600 tabular-nums pt-0.5">
                        {formatDate(obj.endDate)}
                      </span>
                    )}
                    <div className="flex justify-end pt-0.5">
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

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-xl bg-gradient-to-t from-white via-white/90 to-transparent"
            />
          </div>
        )}

        <div className="flex shrink-0 justify-center gap-3 border-t border-slate-100 pt-3">
          <Button type="button" onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add objective
          </Button>
          <Button type="button" variant="secondary" onClick={() => setGenerateOpen(true)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate objectives
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

      <GenerateObjectivesModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        existingCount={objectives.length}
        onGenerate={handleGenerate}
        periodSelectOptions={periodSelectOptions}
        periodMap={periodMap}
        clientFirstName={clientFirstName}
        targetName={targetName}
        dataCollectionTypeName={dataCollectionTypeName}
      />
    </>
  )
}
