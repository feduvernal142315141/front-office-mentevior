"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ListChecks, TrendingDown, TrendingUp } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { parseLocalDate } from "@/lib/date"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingNumberStepper } from "@/components/custom/FloatingNumberStepper"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { Button } from "@/components/custom/Button"

import { OPERATOR_SMART_CRITERIA_OPTIONS } from "@/lib/types/data-collection.types"
import {
  defaultOperatorForDirection,
  resolveDirectionFromOperator,
  resolveDirectionFromValues,
  resolveEffectiveDirection,
  type ObjectiveDirection,
} from "@/lib/modules/service-plans/constants/objective-direction"
import type { ObjectiveRow } from "./ObjectiveFormModal"
import {
  buildGeneratedObjectiveNames,
  clampObjectiveQuantity,
  computeGeneratedObjectiveCriteriaValues,
  formatCriteriaChipValue,
  formatCriteriaValueForStorage,
  resolveCriteriaUnitKind,
  suggestAmountForQuantity,
  suggestQuantityForAmount,
  MAX_GENERATED_OBJECTIVES,
  type ObjectiveGenerationMode,
} from "./generate-objective-name"

export interface LatestBaseline {
  value: string
  date?: string
  periodCatalogId?: string
}

interface GenerateFormState {
  generationMode: ObjectiveGenerationMode
  quantity: number
  percentageFromStart: number
  amountToDecreaseIncrease: string
  startValue: string
  endValue: string
  operatorSmartCriteria: string
  periodSmartCriteriaCatalogId: string
  valueDuration: string
  periodDurationCatalogId: string
}

type GenerateFieldErrorKey =
  | "generationMode"
  | "quantity"
  | "percentageFromStart"
  | "amountToDecreaseIncrease"
  | "startValue"
  | "endValue"
  | "operatorSmartCriteria"
  | "periodSmartCriteriaCatalogId"
  | "valueDuration"
  | "periodDurationCatalogId"

type GenerateFieldErrors = Partial<Record<GenerateFieldErrorKey, boolean>>

function validateGenerateForm(form: GenerateFormState, isPercentType: boolean): GenerateFieldErrors {
  const errors: GenerateFieldErrors = {}

  if (form.generationMode === "number_of_objectives") {
    if (!form.quantity || form.quantity < 1 || form.quantity > MAX_GENERATED_OBJECTIVES) {
      errors.quantity = true
    }
    if (form.amountToDecreaseIncrease === "" || Number(form.amountToDecreaseIncrease) <= 0) {
      errors.amountToDecreaseIncrease = true
    }
  } else if (!form.percentageFromStart || form.percentageFromStart < 1 || form.percentageFromStart > 100) {
    errors.percentageFromStart = true
  }

  if (!form.startValue) errors.startValue = true
  if (form.endValue === "") errors.endValue = true
  // Sin recorrido entre Start y End no hay serie que progresar
  if (form.startValue !== "" && form.endValue !== "" && Number(form.startValue) === Number(form.endValue)) {
    errors.endValue = true
  }
  // Los tipos porcentuales viven en 0–100
  if (isPercentType) {
    if (form.startValue !== "" && Number(form.startValue) > 100) errors.startValue = true
    if (form.endValue !== "" && Number(form.endValue) > 100) errors.endValue = true
  }
  if (!form.operatorSmartCriteria) errors.operatorSmartCriteria = true
  if (!form.periodSmartCriteriaCatalogId) errors.periodSmartCriteriaCatalogId = true
  if (!form.valueDuration || Number(form.valueDuration) < 1) errors.valueDuration = true
  if (!form.periodDurationCatalogId) errors.periodDurationCatalogId = true
  return errors
}

function createDefaultForm(direction: ObjectiveDirection): GenerateFormState {
  return {
    generationMode: "number_of_objectives",
    quantity: 0,
    percentageFromStart: 0,
    amountToDecreaseIncrease: "0",
    startValue: "0",
    endValue: "0",
    operatorSmartCriteria: defaultOperatorForDirection(direction),
    periodSmartCriteriaCatalogId: "",
    valueDuration: "0",
    periodDurationCatalogId: "",
  }
}

function extractFormFromObjectives(
  objectives: ObjectiveRow[],
  direction: ObjectiveDirection,
): GenerateFormState {
  const defaults = createDefaultForm(direction)
  if (objectives.length === 0) return defaults

  const first = objectives[0]
  // El sentido de una serie ya guardada: sus propios valores en orden de generación,
  // después su operador, y la categoría como último recurso
  const rawValues = objectives
    .map((o) => Number(o.valueSmartCriteria))
    .filter((v) => Number.isFinite(v))
  const seriesDirection = resolveEffectiveDirection(
    rawValues[0] ?? 0,
    rawValues[rawValues.length - 1] ?? 0,
    first.operatorSmartCriteria,
    direction,
  )

  // Criteria values ordenados en el sentido de la serie
  const criteriaValues = [...rawValues].sort((a, b) =>
    seriesDirection === "increase" ? a - b : b - a
  )

  // Calculate average step between consecutive sorted values
  let amount = 0
  if (criteriaValues.length >= 2) {
    const diffs: number[] = []
    for (let i = 0; i < criteriaValues.length - 1; i++) {
      diffs.push(Math.abs(criteriaValues[i] - criteriaValues[i + 1]))
    }
    amount = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length)
  }

  const firstValue = criteriaValues.length > 0 ? criteriaValues[0] : 0
  const lastValue =
    criteriaValues.length > 0 ? criteriaValues[criteriaValues.length - 1] : 0

  // Reverse-engineer startValue: el primer STO es start ± amount
  const startValue =
    amount > 0
      ? seriesDirection === "increase"
        ? firstValue - amount
        : firstValue + amount
      : firstValue

  return {
    generationMode: "number_of_objectives",
    quantity: objectives.length,
    percentageFromStart: 0,
    amountToDecreaseIncrease: String(amount),
    startValue: String(Math.round(startValue * 100) / 100),
    endValue: String(Math.round(lastValue * 100) / 100),
    operatorSmartCriteria: first.operatorSmartCriteria || defaultOperatorForDirection(seriesDirection),
    periodSmartCriteriaCatalogId: first.periodSmartCriteriaCatalogId || "",
    valueDuration: first.valueDuration || "0",
    periodDurationCatalogId: first.periodDurationCatalogId || "",
  }
}

interface GenerateObjectivesModalProps {
  open: boolean
  onClose: () => void
  existingCount: number
  onGenerate: (objectives: ObjectiveRow[]) => void
  periodSelectOptions: { value: string; label: string }[]
  periodMap?: Map<string, string>
  clientFirstName?: string
  targetName?: string
  dataCollectionTypeName?: string
  /** Sentido de la serie según la categoría (Maladaptive reduce, skills adquieren) */
  direction: ObjectiveDirection
  /** Nombre de la categoría, para el aviso cuando la serie la contradice */
  categoryName?: string
  /** ServicePlanUnitOfTime del item (SECONDS/MINUTES/…), para tipos de duración */
  unitOfTime?: string
  /** Último baseline registrado; pre-carga Start Value y período al abrir en modo generar */
  latestBaseline?: LatestBaseline
  /** When true, pre-populates form from initialObjectives and replaces on save */
  editMode?: boolean
  initialObjectives?: ObjectiveRow[]
}

export function GenerateObjectivesModal({
  open,
  onClose,
  existingCount,
  onGenerate,
  periodSelectOptions,
  periodMap,
  clientFirstName,
  targetName,
  dataCollectionTypeName = "",
  direction,
  categoryName,
  unitOfTime,
  latestBaseline,
  editMode = false,
  initialObjectives,
}: GenerateObjectivesModalProps) {
  const [form, setForm] = useState<GenerateFormState>(() => createDefaultForm(direction))
  const [fieldErrors, setFieldErrors] = useState<GenerateFieldErrors>({})
  // Una vez que el clínico elige operador a mano dejamos de sincronizarlo con los valores
  const operatorTouchedRef = useRef(false)

  const isNumberMode = form.generationMode === "number_of_objectives"

  useEffect(() => {
    if (open) {
      if (editMode && initialObjectives && initialObjectives.length > 0) {
        setForm(extractFormFromObjectives(initialObjectives, direction))
        operatorTouchedRef.current = true
      } else {
        const defaults = createDefaultForm(direction)
        // El punto de partida clínico es el último baseline registrado
        if (latestBaseline && Number.isFinite(Number(latestBaseline.value))) {
          defaults.startValue = latestBaseline.value
          if (latestBaseline.periodCatalogId) {
            defaults.periodSmartCriteriaCatalogId = latestBaseline.periodCatalogId
            defaults.periodDurationCatalogId = latestBaseline.periodCatalogId
          }
        }
        setForm(defaults)
        operatorTouchedRef.current = false
      }
      setFieldErrors({})
    }
  }, [open, editMode, initialObjectives, direction, latestBaseline])

  // Una sola fuente de verdad: valores → operador → categoría. Verbo, operador por
  // defecto y serie de valores salen todos de acá.
  const effectiveDirection = useMemo(
    () =>
      resolveEffectiveDirection(
        Number(form.startValue) || 0,
        Number(form.endValue) || 0,
        form.operatorSmartCriteria,
        direction
      ),
    [form.startValue, form.endValue, form.operatorSmartCriteria, direction]
  )

  // Avisos no bloqueantes cuando la serie contradice la categoría o el operador elegido
  const directionWarnings = useMemo(() => {
    const start = Number(form.startValue) || 0
    const end = Number(form.endValue) || 0
    if (start === end) return []

    const warnings: string[] = []
    const valuesDirection = resolveDirectionFromValues(start, end, direction)

    if (valuesDirection !== direction) {
      const label = categoryName?.trim() ? `"${categoryName.trim()}"` : "This category"
      warnings.push(
        direction === "decrease"
          ? `${label} is a reduction category, but this series increases from ${start} to ${end}. The objectives will be phrased as an acquisition series.`
          : `${label} is an acquisition category, but this series decreases from ${start} to ${end}. The objectives will be phrased as a reduction series.`
      )
    }

    const operatorDirection = resolveDirectionFromOperator(form.operatorSmartCriteria, valuesDirection)
    if (operatorDirection !== valuesDirection) {
      const operatorLabel =
        OPERATOR_SMART_CRITERIA_OPTIONS.find((o) => o.value === form.operatorSmartCriteria)?.label ??
        form.operatorSmartCriteria
      warnings.push(
        valuesDirection === "decrease"
          ? `The "${operatorLabel}" operator points to an increase, but the values go from ${start} down to ${end} — the wording will follow the values.`
          : `The "${operatorLabel}" operator points to a reduction, but the values go from ${start} up to ${end} — the wording will follow the values.`
      )
    }

    return warnings
  }, [form.startValue, form.endValue, form.operatorSmartCriteria, direction, categoryName])

  const update = useCallback(
    <K extends keyof GenerateFormState>(field: K, value: GenerateFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value }

        // Auto-calculate in number mode. El rango es absoluto: la serie puede ir
        // hacia abajo (reducir) o hacia arriba (adquirir).
        if (next.generationMode === "number_of_objectives") {
          const start = Number(next.startValue) || 0
          const end = Number(next.endValue) || 0
          const range = Math.abs(start - end)

          if (field === "quantity" || field === "startValue" || field === "endValue") {
            const qty = clampObjectiveQuantity(next.quantity, range)
            next.quantity = qty
            if (qty > 0 && range > 0) {
              next.amountToDecreaseIncrease = String(suggestAmountForQuantity(range, qty))
            }
          } else if (field === "amountToDecreaseIncrease") {
            const amount = Number(value as string) || 0
            if (amount > 0 && range > 0) {
              const qty = suggestQuantityForAmount(range, amount)
              next.quantity = qty
              // Si el tope recortó la cantidad, agrandamos el paso para igual llegar al End
              const needed = suggestAmountForQuantity(range, qty)
              if (needed > amount) next.amountToDecreaseIncrease = String(needed)
            }
          }
        }

        // Auto-fill duration period when smart criteria period is selected
        if (field === "periodSmartCriteriaCatalogId" && value && !prev.periodDurationCatalogId) {
          next.periodDurationCatalogId = value as string
        }

        // El operador sigue al sentido que marcan los valores, hasta que lo toquen a mano
        if (field === "operatorSmartCriteria") {
          operatorTouchedRef.current = true
        } else if (
          (field === "startValue" || field === "endValue") &&
          !operatorTouchedRef.current
        ) {
          next.operatorSmartCriteria = defaultOperatorForDirection(
            resolveDirectionFromValues(
              Number(next.startValue) || 0,
              Number(next.endValue) || 0,
              direction
            )
          )
        }

        return next
      })
      setFieldErrors((prev) => {
        if (!(field in prev)) return prev
        const next = { ...prev }
        delete next[field as GenerateFieldErrorKey]
        return next
      })
    },
    [direction]
  )

  const resolvedPeriodMap = useMemo(() => {
    if (periodMap instanceof Map) return periodMap
    return new Map(periodSelectOptions.map((option) => [option.value, option.label]))
  }, [periodMap, periodSelectOptions])

  const isPercentType = resolveCriteriaUnitKind(dataCollectionTypeName) === "percent"
  const isDecrease = effectiveDirection === "decrease"

  // El modo porcentual toma su tajada del baseline al reducir y de la meta al adquirir;
  // el label y la nota lo hacen explícito en la UI
  const generationModeOptions = useMemo(
    () => [
      { value: "number_of_objectives" as ObjectiveGenerationMode, label: "Number of Objectives" },
      {
        value: "percentage_from_start_value" as ObjectiveGenerationMode,
        label: isDecrease ? "Percentage of Baseline" : "Percentage of Goal",
      },
    ],
    [isDecrease]
  )

  const baselineHint = useMemo(() => {
    if (!latestBaseline) return null
    const periodLabel = latestBaseline.periodCatalogId
      ? resolvedPeriodMap.get(latestBaseline.periodCatalogId)?.toLowerCase()
      : undefined
    let dateLabel = ""
    if (latestBaseline.date) {
      try {
        dateLabel = format(parseLocalDate(latestBaseline.date), "MM/dd/yyyy")
      } catch {
        dateLabel = latestBaseline.date
      }
    }
    return `Latest baseline: ${latestBaseline.value}${periodLabel ? ` per ${periodLabel}` : ""}${dateLabel ? ` · ${dateLabel}` : ""}`
  }, [latestBaseline, resolvedPeriodMap])

  const percentStepNote = useMemo(() => {
    if (isNumberMode || form.percentageFromStart <= 0) return null
    const start = Number(form.startValue) || 0
    const end = Number(form.endValue) || 0
    if (start === end) return null
    const base = isDecrease ? Math.abs(start) : Math.abs(end)
    if (base <= 0) return null
    const step = formatCriteriaChipValue(
      base * (form.percentageFromStart / 100),
      dataCollectionTypeName,
      unitOfTime
    )
    return isDecrease
      ? `Each objective steps down ${form.percentageFromStart}% of the baseline (${start}) ≈ ${step}.`
      : `Each objective steps up ${form.percentageFromStart}% of the goal (${end}) ≈ ${step}.`
  }, [isNumberMode, form.percentageFromStart, form.startValue, form.endValue, isDecrease, dataCollectionTypeName, unitOfTime])

  const criteriaValues = useMemo(
    () =>
      computeGeneratedObjectiveCriteriaValues({
        mode: form.generationMode,
        quantity: form.quantity,
        amountToDecreaseIncrease: form.amountToDecreaseIncrease,
        percentageFromStart: form.percentageFromStart,
        startValue: form.startValue,
        endValue: form.endValue,
        dataCollectionTypeName,
        direction: effectiveDirection,
      }),
    [
      form.generationMode,
      form.quantity,
      form.amountToDecreaseIncrease,
      form.percentageFromStart,
      form.startValue,
      form.endValue,
      dataCollectionTypeName,
      effectiveDirection,
    ]
  )

  const previewNames = useMemo(
    () =>
      buildGeneratedObjectiveNames(
        criteriaValues.length,
        existingCount,
        {
          operatorSmartCriteria: form.operatorSmartCriteria,
          valueSmartCriteria: form.startValue,
          periodSmartCriteriaCatalogId: form.periodSmartCriteriaCatalogId,
          valueDuration: form.valueDuration,
          periodDurationCatalogId: form.periodDurationCatalogId,
          clientFirstName,
          targetName,
          periodMap: resolvedPeriodMap,
          dataCollectionTypeName,
          direction: effectiveDirection,
          baselineValue: form.startValue,
          unitOfTime,
        },
        criteriaValues
      ),
    [
      form,
      existingCount,
      clientFirstName,
      targetName,
      resolvedPeriodMap,
      criteriaValues,
      dataCollectionTypeName,
      effectiveDirection,
      unitOfTime,
    ]
  )

  // El tope de la serie (rango o máximo de STOs) puede recortar lo pedido; se avisa
  const seriesNote = useMemo(() => {
    if (!isNumberMode || form.quantity <= 0 || criteriaValues.length === 0) return null
    if (criteriaValues.length >= form.quantity) return null
    return `Only ${criteriaValues.length} ${criteriaValues.length === 1 ? "objective fits" : "objectives fit"} between ${form.startValue} and ${form.endValue} with this step — the series stops at the End Value.`
  }, [isNumberMode, form.quantity, form.startValue, form.endValue, criteriaValues])

  const handleGenerate = useCallback(() => {
    const errors = validateGenerateForm(form, isPercentType)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const generated: ObjectiveRow[] = previewNames.map((name, index) => {
      const numericValue = criteriaValues[index] ?? (Number(form.startValue) || 0)
      return {
        localId: crypto.randomUUID(),
        name,
        startDate: "",
        estimatedEndDate: "",
        endDate: "",
        operatorSmartCriteria: form.operatorSmartCriteria,
        valueSmartCriteria: formatCriteriaValueForStorage(numericValue, dataCollectionTypeName),
        periodSmartCriteriaCatalogId: form.periodSmartCriteriaCatalogId,
        valueDuration: form.valueDuration,
        periodDurationCatalogId: form.periodDurationCatalogId,
      }
    })

    onGenerate(generated)
    onClose()
  }, [form, isPercentType, previewNames, criteriaValues, dataCollectionTypeName, onGenerate, onClose])

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => { if (!next) onClose() }}
      title={editMode ? "Edit All Objectives" : "Generate Objectives"}
      titleAccessory={
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide",
            isDecrease
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {isDecrease ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
          {isDecrease ? "Reduction series" : "Acquisition series"}
        </span>
      }
      description={
        [categoryName, targetName].filter((v) => v?.trim()).join(" · ") || undefined
      }
      maxWidthClassName="sm:max-w-[720px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      <div className="px-6 py-5 space-y-5 max-h-[calc(85vh-140px)] min-h-[520px] overflow-y-auto custom-scrollbar">
        {/* Generation mode + quantity or percentage stepper */}
        <div className="grid grid-cols-2 gap-4">
          <FloatingSelect
            label="Generation type"
            value={form.generationMode}
            onChange={(v) => update("generationMode", v as ObjectiveGenerationMode)}
            options={generationModeOptions}
            required
          />

          {isNumberMode ? (
            <FloatingNumberStepper
              label="Number of objectives"
              value={form.quantity}
              onChange={(val) => update("quantity", val)}
              min={0}
              max={MAX_GENERATED_OBJECTIVES}
              hasError={!!fieldErrors.quantity}
              required
            />
          ) : (
            <FloatingNumberStepper
              label="Percentage"
              value={form.percentageFromStart}
              onChange={(val) => update("percentageFromStart", val)}
              min={0}
              max={100}
              hasError={!!fieldErrors.percentageFromStart}
              required
              suffix="%"
            />
          )}
        </div>

        {percentStepNote && (
          <p className="text-xs text-slate-500 leading-snug px-1 -mt-3">{percentStepNote}</p>
        )}

        {/* Start / End value */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <FloatingInput
              label="Start Value (Baseline)"
              value={form.startValue}
              onChange={(v) => update("startValue", v.replace(/[^0-9.]/g, ""))}
              onBlur={() => {}}
              inputMode="decimal"
              required
              hasError={!!fieldErrors.startValue}
              clearZeroOnFocus
            />
            {baselineHint && (
              <p className="text-xs text-slate-500 leading-snug px-1">{baselineHint}</p>
            )}
          </div>
          <FloatingInput
            label="End Value (Goal)"
            value={form.endValue}
            onChange={(v) => update("endValue", v.replace(/[^0-9.]/g, ""))}
            onBlur={() => {}}
            inputMode="decimal"
            required
            hasError={!!fieldErrors.endValue}
            clearZeroOnFocus
          />
        </div>

        {isNumberMode && (
          <div className="space-y-1.5">
            <FloatingInput
              label={isDecrease ? "Amount to Decrease" : "Amount to Increase"}
              value={form.amountToDecreaseIncrease}
              onChange={(v) => update("amountToDecreaseIncrease", v.replace(/[^0-9.]/g, ""))}
              onBlur={() => {}}
              inputMode="decimal"
              required
              hasError={!!fieldErrors.amountToDecreaseIncrease}
              clearZeroOnFocus
            />
            {seriesNote && (
              <p className="text-xs text-slate-500 leading-snug px-1">{seriesNote}</p>
            )}
          </div>
        )}

        {/* Smart Criteria */}
        <div className="grid grid-cols-2 gap-4">
          <FloatingSelect
            label="Smart Criteria"
            value={form.operatorSmartCriteria}
            onChange={(v) => update("operatorSmartCriteria", v)}
            options={OPERATOR_SMART_CRITERIA_OPTIONS}
            required
            hasError={!!fieldErrors.operatorSmartCriteria}
          />
          <FloatingSelect
            label="Period"
            value={form.periodSmartCriteriaCatalogId}
            onChange={(v) => update("periodSmartCriteriaCatalogId", v)}
            options={periodSelectOptions}
            required
            hasError={!!fieldErrors.periodSmartCriteriaCatalogId}
          />
        </div>

        {/* Direction warnings */}
        {directionWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
            {directionWarnings.map((warning) => (
              <p key={warning} className="text-xs text-amber-800 leading-snug">
                {warning}
              </p>
            ))}
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Duration</label>
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Value"
              value={form.valueDuration}
              onChange={(v) => update("valueDuration", v.replace(/[^0-9.]/g, ""))}
              onBlur={() => {}}
              inputMode="numeric"
              required
              hasError={!!fieldErrors.valueDuration}
              clearZeroOnFocus
            />
            <FloatingSelect
              label="Period"
              value={form.periodDurationCatalogId}
              onChange={(v) => update("periodDurationCatalogId", v)}
              options={periodSelectOptions}
              required
              hasError={!!fieldErrors.periodDurationCatalogId}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Preview</label>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {previewNames.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <ListChecks className="h-6 w-6 text-slate-300" />
                <p className="text-sm text-slate-500">
                  Fill in the values above to preview the objectives.
                </p>
                <p className="text-xs text-slate-400">
                  The series will run from the Start Value (baseline) to the End Value (goal).
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Name
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Criteria
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {previewNames.map((name, index) => {
                    const isGoal = index === previewNames.length - 1
                    return (
                      <div
                        key={`${existingCount + index + 1}-${name}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0"
                      >
                        <p className="text-xs text-slate-700 truncate" title={name}>
                          {name}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums",
                            isGoal
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                          title={isGoal ? "End Value — the series goal" : undefined}
                        >
                          {formatCriteriaChipValue(
                            criteriaValues[index] ?? 0,
                            dataCollectionTypeName,
                            unitOfTime
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleGenerate} disabled={previewNames.length === 0}>
          {editMode ? "Update" : "Generate"} {previewNames.length} {previewNames.length === 1 ? "objective" : "objectives"}
        </Button>
      </div>
    </CustomModal>
  )
}
