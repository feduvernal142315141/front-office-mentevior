"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingNumberStepper } from "@/components/custom/FloatingNumberStepper"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { Button } from "@/components/custom/Button"

import { OPERATOR_SMART_CRITERIA_OPTIONS } from "@/lib/types/data-collection.types"
import type { ObjectiveRow } from "./ObjectiveFormModal"
import {
  buildGeneratedObjectiveNames,
  computeGeneratedObjectiveCriteriaValues,
  formatCriteriaValueForStorage,
  type ObjectiveGenerationMode,
} from "./generate-objective-name"

const GENERATION_MODE_OPTIONS: { value: ObjectiveGenerationMode; label: string }[] = [
  { value: "number_of_objectives", label: "Number of Objectives" },
  { value: "percentage_from_start_value", label: "Percentage from Start Value" },
]

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

function validateGenerateForm(form: GenerateFormState): GenerateFieldErrors {
  const errors: GenerateFieldErrors = {}

  if (form.generationMode === "number_of_objectives") {
    if (!form.quantity || form.quantity < 1) {
      errors.quantity = true
    }
    if (form.amountToDecreaseIncrease === "" || Number(form.amountToDecreaseIncrease) < 0) {
      errors.amountToDecreaseIncrease = true
    }
  } else if (!form.percentageFromStart || form.percentageFromStart < 1 || form.percentageFromStart > 100) {
    errors.percentageFromStart = true
  }

  if (!form.startValue) errors.startValue = true
  if (form.endValue === "") errors.endValue = true
  if (!form.operatorSmartCriteria) errors.operatorSmartCriteria = true
  if (!form.periodSmartCriteriaCatalogId) errors.periodSmartCriteriaCatalogId = true
  if (!form.valueDuration) errors.valueDuration = true
  if (!form.periodDurationCatalogId) errors.periodDurationCatalogId = true
  return errors
}

function createDefaultForm(): GenerateFormState {
  return {
    generationMode: "number_of_objectives",
    quantity: 0,
    percentageFromStart: 0,
    amountToDecreaseIncrease: "0",
    startValue: "0",
    endValue: "0",
    operatorSmartCriteria: "LTE",
    periodSmartCriteriaCatalogId: "",
    valueDuration: "0",
    periodDurationCatalogId: "",
  }
}

function extractFormFromObjectives(
  objectives: ObjectiveRow[],
): GenerateFormState {
  const defaults = createDefaultForm()
  if (objectives.length === 0) return defaults

  const first = objectives[0]

  // Extract numeric criteria values, sorted descending
  const criteriaValues = objectives
    .map((o) => Number(o.valueSmartCriteria))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => b - a)

  // Calculate average step between consecutive sorted values
  let amount = 0
  if (criteriaValues.length >= 2) {
    const diffs: number[] = []
    for (let i = 0; i < criteriaValues.length - 1; i++) {
      diffs.push(Math.abs(criteriaValues[i] - criteriaValues[i + 1]))
    }
    amount = Math.round((diffs.reduce((s, d) => s + d, 0) / diffs.length) * 100) / 100
  }

  const highestValue = criteriaValues.length > 0 ? criteriaValues[0] : 0
  const lowestValue =
    criteriaValues.length > 0 ? criteriaValues[criteriaValues.length - 1] : 0

  // Reverse-engineer startValue: first STO = start - amount, so start = highest + amount
  const startValue = amount > 0 ? highestValue + amount : highestValue

  return {
    generationMode: "number_of_objectives",
    quantity: objectives.length,
    percentageFromStart: 0,
    amountToDecreaseIncrease: String(amount),
    startValue: String(Math.round(startValue * 100) / 100),
    endValue: String(Math.round(lowestValue * 100) / 100),
    operatorSmartCriteria: first.operatorSmartCriteria || "LTE",
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
  editMode = false,
  initialObjectives,
}: GenerateObjectivesModalProps) {
  const [form, setForm] = useState<GenerateFormState>(createDefaultForm())
  const [fieldErrors, setFieldErrors] = useState<GenerateFieldErrors>({})

  const isNumberMode = form.generationMode === "number_of_objectives"

  useEffect(() => {
    if (open) {
      if (editMode && initialObjectives && initialObjectives.length > 0) {
        setForm(extractFormFromObjectives(initialObjectives))
      } else {
        setForm(createDefaultForm())
      }
      setFieldErrors({})
    }
  }, [open, editMode, initialObjectives])

  const update = useCallback(
    <K extends keyof GenerateFormState>(field: K, value: GenerateFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value }

        // Auto-calculate in number mode
        if (next.generationMode === "number_of_objectives") {
          const start = Number(next.startValue) || 0
          const end = Number(next.endValue) || 0
          const range = start - end

          if (field === "quantity" || field === "startValue" || field === "endValue") {
            const qty = next.quantity
            if (qty > 0 && range > 0) {
              next.amountToDecreaseIncrease = String(
                Math.round((range / qty) * 100) / 100
              )
            }
          } else if (field === "amountToDecreaseIncrease") {
            const amount = Number(value as string) || 0
            if (amount > 0 && range > 0) {
              next.quantity = Math.ceil(range / amount)
            }
          }
        }

        // Auto-fill duration period when smart criteria period is selected
        if (field === "periodSmartCriteriaCatalogId" && value && !prev.periodDurationCatalogId) {
          next.periodDurationCatalogId = value as string
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
    []
  )

  const resolvedPeriodMap = useMemo(() => {
    if (periodMap instanceof Map) return periodMap
    return new Map(periodSelectOptions.map((option) => [option.value, option.label]))
  }, [periodMap, periodSelectOptions])

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
      }),
    [
      form.generationMode,
      form.quantity,
      form.amountToDecreaseIncrease,
      form.percentageFromStart,
      form.startValue,
      form.endValue,
      dataCollectionTypeName,
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
    ]
  )

  const handleGenerate = useCallback(() => {
    const errors = validateGenerateForm(form)
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
  }, [form, previewNames, criteriaValues, dataCollectionTypeName, onGenerate, onClose])

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => { if (!next) onClose() }}
      title={editMode ? "Edit All Objectives" : "Generate Objectives"}
      maxWidthClassName="sm:max-w-[720px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      <div className="px-6 py-5 space-y-5 max-h-[calc(85vh-140px)] overflow-y-auto custom-scrollbar">
        {/* Generation mode + quantity or percentage stepper */}
        <div className="grid grid-cols-2 gap-4">
          <FloatingSelect
            label="Generation type"
            value={form.generationMode}
            onChange={(v) => update("generationMode", v as ObjectiveGenerationMode)}
            options={GENERATION_MODE_OPTIONS}
            required
          />

          {isNumberMode ? (
            <FloatingNumberStepper
              label="Number of objectives"
              value={form.quantity}
              onChange={(val) => update("quantity", val)}
              min={0}
              max={50}
              hasError={!!fieldErrors.quantity}
              required
            />
          ) : (
            <FloatingNumberStepper
              label="Percentage from Start Value"
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

        {/* Start / End value */}
        <div className="grid grid-cols-2 gap-4">
          <FloatingInput
            label="Start Value"
            value={form.startValue}
            onChange={(v) => update("startValue", v.replace(/[^0-9.-]/g, ""))}
            onBlur={() => {}}
            inputMode="decimal"
            required
            hasError={!!fieldErrors.startValue}
            clearZeroOnFocus
          />
          <FloatingInput
            label="End Value"
            value={form.endValue}
            onChange={(v) => update("endValue", v.replace(/[^0-9.-]/g, ""))}
            onBlur={() => {}}
            inputMode="decimal"
            required
            hasError={!!fieldErrors.endValue}
            clearZeroOnFocus
          />
        </div>

        {isNumberMode && (
          <FloatingInput
            label="Amount to Decrease/Increase"
            value={form.amountToDecreaseIncrease}
            onChange={(v) => update("amountToDecreaseIncrease", v.replace(/[^0-9.-]/g, ""))}
            onBlur={() => {}}
            inputMode="decimal"
            required
            hasError={!!fieldErrors.amountToDecreaseIncrease}
            clearZeroOnFocus
          />
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

        {/* Duration */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Duration</label>
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Value"
              value={form.valueDuration}
              onChange={(v) => update("valueDuration", v.replace(/[^0-9.-]/g, ""))}
              onBlur={() => {}}
              inputMode="numeric"
              required
              hasError={!!fieldErrors.valueDuration}
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
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                Name
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {previewNames.map((name, index) => (
                <div
                  key={`${existingCount + index + 1}-${name}`}
                  className="px-4 py-2.5 border-b border-slate-100 last:border-b-0"
                >
                  <p className="text-xs text-slate-700 truncate" title={name}>
                    {name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleGenerate}>
          {editMode ? "Update" : "Generate"} {previewNames.length} {previewNames.length === 1 ? "objective" : "objectives"}
        </Button>
      </div>
    </CustomModal>
  )
}
