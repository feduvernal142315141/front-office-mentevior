"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Sparkles, Target, Trash2 } from "lucide-react"
import { toast } from "@/lib/compat/sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { parseLocalDate } from "@/lib/date"

import { Button } from "@/components/custom/Button"
import { Badge } from "@/components/ui/badge"
import {
  OPERATOR_SMART_CRITERIA_OPTIONS,
  type ObjectiveStatus,
  type ObjetiveType,
} from "@/lib/types/data-collection.types"
import {
  deleteClientCategoryObjective,
  deleteClientItemObjective,
} from "@/lib/modules/client-service-plan/services/client-data-collection.service"

import {
  ObjectiveFormModal,
  type ObjectiveRow,
} from "./ObjectiveFormModal"
import type { BaselineRow } from "./BaselinesTabContent"
import { GenerateObjectivesModal } from "./GenerateObjectivesModal"
import {
  buildGeneratedObjectiveName,
  buildMasteryObjectiveName,
  extractBaselineFromName,
} from "./generate-objective-name"
import {
  resolveDirectionFromOperator,
  resolveObjectiveDirection,
  type ObjectiveDirection,
} from "@/lib/modules/service-plans/constants/objective-direction"
import { useModulePermissions } from "@/lib/hooks/use-module-permissions"
import { PermissionModule } from "@/lib/utils/permissions-new"

interface ObjectivesTabContentProps {
  objectives: ObjectiveRow[]
  onChange: (objectives: ObjectiveRow[]) => void
  mode: "category" | "item"
  periodMap: Map<string, string>
  periodSelectOptions: { value: string; label: string }[]
  clientFirstName?: string
  targetName?: string
  dataCollectionTypeName?: string
  /** Id del catálogo global de categorías; decide si la serie reduce o adquiere */
  categoryCatalogId?: string
  categoryName?: string
  /** ServicePlanUnitOfTime del item (SECONDS/MINUTES/…), para tipos de duración */
  unitOfTime?: string
  /** Baselines del item; el más reciente pre-carga el Start Value del generador */
  baselines?: BaselineRow[]
  hideButtons?: boolean
  externalTitle?: boolean
  disableActions?: boolean
  onModalChange?: (open: boolean) => void
  /** Persisted objective type; when absent it is inferred from the objective names */
  objetiveType?: ObjetiveType | null
  onObjetiveTypeChange?: (type: ObjetiveType | null) => void
}

/** Objectives created by the STO generator are named "STO#N: …"; manual ones "Mastery criteria: …" */
export function inferObjetiveType(objectives: ObjectiveRow[]): ObjetiveType | null {
  if (objectives.length === 0) return null
  return objectives.some((o) => o.name.trim().startsWith("STO#")) ? "STO" : "Mastery"
}

function computeStatus(obj: ObjectiveRow): ObjectiveStatus {
  // Use server-provided status when available
  if (obj.status) {
    const normalized = obj.status.replace(/[\s_-]/g, "").toLowerCase()
    if (normalized === "mastered") return "mastered"
    if (normalized === "inprogress") return "in_progress"
    if (normalized === "notstarted") return "not_started"
  }
  // Fallback to date-based computation
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
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
  categoryCatalogId,
  categoryName,
  unitOfTime,
  baselines,
  hideButtons = false,
  externalTitle = false,
  disableActions = false,
  onModalChange,
  objetiveType = null,
  onObjetiveTypeChange,
}: ObjectivesTabContentProps) {
  const direction: ObjectiveDirection = useMemo(
    () => resolveObjectiveDirection(categoryCatalogId, categoryName),
    [categoryCatalogId, categoryName]
  )

  // Último baseline registrado (por fecha); pre-carga el Start Value del generador
  const latestBaseline = useMemo(() => {
    const rows = (baselines ?? []).filter(
      (b) => b.value.trim() !== "" && Number.isFinite(Number(b.value))
    )
    if (rows.length === 0) return undefined
    const last = [...rows].sort((a, b) => (a.date || "").localeCompare(b.date || ""))[rows.length - 1]
    return { value: last.value, date: last.date, periodCatalogId: last.periodCatalogId }
  }, [baselines])
  const { canCreate, canEdit, canDelete } = useModulePermissions(PermissionModule.CLIENTS)
  const actionsDisabled = disableActions || !canEdit

  const [formOpen, setFormOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)

  // Mastery and STO objectives are mutually exclusive: picking one path locks the other
  // until the objectives are removed, so providers can't mix both by mistake.
  const effectiveType = objetiveType ?? inferObjetiveType(objectives)
  const masteryLocked = effectiveType === "STO"
  const stoLocked = effectiveType === "Mastery"
  const masteryLockTitle = masteryLocked ? "This item uses STO objectives — remove them to switch to Mastery criteria" : undefined
  const stoLockTitle = stoLocked ? "This item uses a Mastery criteria objective — remove it to generate STOs" : undefined

  // Notify parent when any modal opens/closes
  useEffect(() => {
    onModalChange?.(formOpen || generateOpen || bulkEditOpen)
  }, [formOpen, generateOpen, bulkEditOpen, onModalChange])
  const [editingObjective, setEditingObjective] = useState<ObjectiveRow | null>(null)

  const handleAdd = useCallback(() => {
    setEditingObjective(null)
    setFormOpen(true)
  }, [])

  const handleRowClick = useCallback((obj: ObjectiveRow) => {
    setEditingObjective(obj)
    setFormOpen(true)
  }, [])

  const buildMasteryCriteriaName = useCallback(
    (obj: ObjectiveRow): string =>
      buildMasteryObjectiveName({
        operatorSmartCriteria: obj.operatorSmartCriteria,
        valueSmartCriteria: obj.valueSmartCriteria,
        periodSmartCriteriaCatalogId: obj.periodSmartCriteriaCatalogId,
        valueDuration: obj.valueDuration,
        periodDurationCatalogId: obj.periodDurationCatalogId,
        clientFirstName,
        targetName,
        periodMap,
        dataCollectionTypeName,
        // Objetivo suelto, sin serie: el sentido lo da su operador y después la categoría
        direction: resolveDirectionFromOperator(obj.operatorSmartCriteria, direction),
        unitOfTime,
      }),
    [clientFirstName, targetName, periodMap, dataCollectionTypeName, direction, unitOfTime],
  )

  // Live name for the edit modal: values typed in the form rewrite the name as you type.
  // STO names keep their number and the generator's template; everything else is Mastery.
  const buildLiveName = useCallback(
    (obj: ObjectiveRow): string => {
      const stoMatch = obj.name.trim().match(/^STO#(\d+)/)
      if (stoMatch) {
        return buildGeneratedObjectiveName({
          index: Number(stoMatch[1]),
          operatorSmartCriteria: obj.operatorSmartCriteria,
          valueSmartCriteria: obj.valueSmartCriteria,
          periodSmartCriteriaCatalogId: obj.periodSmartCriteriaCatalogId,
          valueDuration: obj.valueDuration,
          periodDurationCatalogId: obj.periodDurationCatalogId,
          clientFirstName,
          targetName,
          periodMap,
          dataCollectionTypeName,
          direction: resolveDirectionFromOperator(obj.operatorSmartCriteria, direction),
          // El baseline vive en el nombre generado; se rescata para no perderlo al editar
          baselineValue: extractBaselineFromName(obj.name),
          unitOfTime,
        })
      }
      return buildMasteryCriteriaName(obj)
    },
    [buildMasteryCriteriaName, clientFirstName, targetName, periodMap, dataCollectionTypeName, direction, unitOfTime],
  )

  const handleSave = useCallback(
    (saved: ObjectiveRow) => {
      const exists = objectives.some((o) => o.localId === saved.localId)
      if (exists) {
        onChange(objectives.map((o) => (o.localId === saved.localId ? saved : o)))
      } else {
        // Build name automatically if empty or not already prefixed
        let finalName = saved.name.trim()
        if (!finalName || (!finalName.startsWith("STO#") && !finalName.startsWith("Mastery"))) {
          finalName = buildMasteryCriteriaName(saved)
        }
        onChange([...objectives, { ...saved, name: finalName }])
        onObjetiveTypeChange?.("Mastery")
      }
    },
    [objectives, onChange, buildMasteryCriteriaName, onObjetiveTypeChange]
  )

  const handleDelete = useCallback(
    (deleted: ObjectiveRow) => {
      const remaining = objectives.filter((o) => o.localId !== deleted.localId)
      onChange(remaining)
      if (remaining.length === 0) onObjetiveTypeChange?.(null)
    },
    [objectives, onChange, onObjetiveTypeChange]
  )

  const handleGenerate = useCallback(
    (generated: ObjectiveRow[]) => {
      onChange([...objectives, ...generated])
      onObjetiveTypeChange?.("STO")
    },
    [objectives, onChange, onObjetiveTypeChange]
  )

  const handleBulkSave = useCallback(
    (updated: ObjectiveRow[]) => {
      onChange(updated)
      onObjetiveTypeChange?.(inferObjetiveType(updated))
    },
    [onChange, onObjetiveTypeChange]
  )

  const getSmartCriteriaSummary = useCallback(
    (obj: ObjectiveRow): string => {
      const opLabel = OPERATOR_SMART_CRITERIA_OPTIONS.find(
        (o) => o.value === obj.operatorSmartCriteria
      )?.label ?? obj.operatorSmartCriteria
      const OPERATOR_PHRASE: Record<string, string> = {
        ">": "greater than", ">=": "greater or equal to", "=": "equal to",
        "<": "less than", "<=": "less or equal to",
      }
      const op = OPERATOR_PHRASE[opLabel] ?? opLabel
      const period = periodMap.get(obj.periodSmartCriteriaCatalogId) ?? ""
      const durPeriod = periodMap.get(obj.periodDurationCatalogId) ?? ""
      const durNum = Number(obj.valueDuration)
      const pluralDur = durNum !== 1 ? `${durPeriod.toLowerCase()}s` : durPeriod.toLowerCase()
      const parts: string[] = []
      if (op && obj.valueSmartCriteria) parts.push(`${op} ${obj.valueSmartCriteria}`)
      if (period) parts.push(`per ${period.toLowerCase()}`)
      if (obj.valueDuration && durPeriod) parts.push(`for ${obj.valueDuration} ${pluralDur}`)
      return parts.length > 0 ? parts.join(" ") + "." : ""
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
    cols.push("36px")
    return cols.join(" ")
  }, [showStartDate, showEstEndDate, showEndDate])

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleInlineDelete = useCallback(
    async (e: React.MouseEvent, obj: ObjectiveRow) => {
      e.stopPropagation()
      if (obj.recordId) {
        setDeletingId(obj.localId)
        try {
          if (mode === "item") {
            await deleteClientItemObjective(obj.recordId)
          } else {
            await deleteClientCategoryObjective(obj.recordId)
          }
          toast.success("Objective removed")
        } catch {
          toast.error("Failed to delete objective")
          setDeletingId(null)
          return
        }
        setDeletingId(null)
      }
      const remaining = objectives.filter((o) => o.localId !== obj.localId)
      onChange(remaining)
      if (remaining.length === 0) onObjetiveTypeChange?.(null)
    },
    [objectives, onChange, mode, onObjetiveTypeChange]
  )

  return (
    <>
      <div className="flex flex-col gap-3">
        {externalTitle && (
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">
              Objectives
              {objectives.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500">({objectives.length})</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {canCreate && (
                <Button type="button" onClick={handleAdd} className="gap-1.5 text-sm h-8 px-3" disabled={actionsDisabled || masteryLocked} title={masteryLockTitle}>
                  <Plus className="h-3.5 w-3.5" />
                  Mastery Criteria Objective
                </Button>
              )}
              {objectives.length > 0 && canEdit && (
                <Button type="button" variant="secondary" onClick={() => setBulkEditOpen(true)} className="gap-1.5 text-sm h-8 px-3" disabled={actionsDisabled}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit All
                </Button>
              )}
              {canCreate && (
                <Button type="button" variant="secondary" onClick={() => setGenerateOpen(true)} className="gap-1.5 text-sm h-8 px-3" disabled={actionsDisabled || stoLocked} title={stoLockTitle}>
                  <Sparkles className="h-3.5 w-3.5" />
                  STO Objective Generate
                </Button>
              )}
            </div>
          </div>
        )}
        {objectives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 text-center">
            <p className="text-sm text-slate-500">No objectives configured yet.</p>
          </div>
        ) : (
          <div className="relative rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="max-h-[clamp(180px,40vh,520px)] overflow-y-auto custom-scrollbar overscroll-contain pb-8">
              <div
                className="sticky top-0 z-10 grid gap-2 px-4 py-2.5 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200"
                style={{ gridTemplateColumns }}
              >
                <span className={HEADER_CLASS}>Name</span>
                {showStartDate && <span className={HEADER_CLASS}>Start Date</span>}
                {showEstEndDate && <span className={HEADER_CLASS}>Est. End Date</span>}
                {showEndDate && <span className={HEADER_CLASS}>End Date</span>}
                <span className={cn(HEADER_CLASS, "text-right")}>Status</span>
                <span />
              </div>

              {objectives.map((obj) => {
                const status = computeStatus(obj)
                const statusCfg = STATUS_CONFIG[status]
                const smartSummary = getSmartCriteriaSummary(obj)

                return (
                  <div
                    key={obj.localId}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowClick(obj)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleRowClick(obj) }}
                    className="grid gap-2 items-start px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors w-full text-left cursor-pointer"
                    style={{ gridTemplateColumns }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 whitespace-normal break-words leading-snug">
                        {decodeHtmlEntities(obj.name) || "Untitled"}
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
                    <div className="flex justify-center pt-0.5">
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => void handleInlineDelete(e, obj)}
                          disabled={deletingId === obj.localId || actionsDisabled}
                          className={cn(
                            "rounded-md p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          title="Remove objective"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-xl bg-gradient-to-t from-white via-white/90 to-transparent"
            />
          </div>
        )}

        {!hideButtons && (
          <div className="flex shrink-0 justify-center gap-3 border-t border-slate-100 pt-3">
            {canCreate && (
              <Button type="button" onClick={handleAdd} className="gap-2" disabled={actionsDisabled || masteryLocked} title={masteryLockTitle}>
                <Plus className="h-4 w-4" />
                Mastery Criteria Objective
              </Button>
            )}
            {objectives.length > 0 && canEdit && (
              <Button type="button" variant="secondary" onClick={() => setBulkEditOpen(true)} className="gap-2" disabled={actionsDisabled}>
                <Pencil className="h-4 w-4" />
                Edit All
              </Button>
            )}
            {canCreate && (
              <Button type="button" variant="secondary" onClick={() => setGenerateOpen(true)} className="gap-2" disabled={actionsDisabled || stoLocked} title={stoLockTitle}>
                <Sparkles className="h-4 w-4" />
                STO Objective Generate
              </Button>
            )}
          </div>
        )}
      </div>

      <ObjectiveFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        objective={editingObjective}
        mode={mode}
        onSave={handleSave}
        onDelete={handleDelete}
        periodSelectOptions={periodSelectOptions}
        direction={direction}
        buildAutoName={buildLiveName}
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
        direction={direction}
        categoryName={categoryName}
        unitOfTime={unitOfTime}
        latestBaseline={latestBaseline}
      />

      <GenerateObjectivesModal
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        existingCount={0}
        onGenerate={handleBulkSave}
        periodSelectOptions={periodSelectOptions}
        periodMap={periodMap}
        clientFirstName={clientFirstName}
        targetName={targetName}
        dataCollectionTypeName={dataCollectionTypeName}
        direction={direction}
        categoryName={categoryName}
        unitOfTime={unitOfTime}
        latestBaseline={latestBaseline}
        editMode
        initialObjectives={objectives}
      />
    </>
  )
}
