"use client"

import { useCallback, useEffect, useState } from "react"
import { Minus, Plus } from "lucide-react"

import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Button } from "@/components/custom/Button"

import { OPERATOR_SMART_CRITERIA_OPTIONS } from "@/lib/types/data-collection.types"
import type { ObjectiveRow } from "./ObjectiveFormModal"

interface GenerateFormState {
  quantity: number
  startDate: string
  estimatedEndDate: string
  operatorSmartCriteria: string
  valueSmartCriteria: string
  periodSmartCriteriaCatalogId: string
  valueDuration: string
  periodDurationCatalogId: string
}

type GenerateFieldErrorKey =
  | "quantity"
  | "startDate"
  | "operatorSmartCriteria"
  | "valueSmartCriteria"
  | "periodSmartCriteriaCatalogId"
  | "valueDuration"
  | "periodDurationCatalogId"

type GenerateFieldErrors = Partial<Record<GenerateFieldErrorKey, boolean>>

function validateGenerateForm(form: GenerateFormState): GenerateFieldErrors {
  const errors: GenerateFieldErrors = {}
  if (!form.quantity || form.quantity < 1) errors.quantity = true
  if (!form.startDate) errors.startDate = true
  if (!form.operatorSmartCriteria) errors.operatorSmartCriteria = true
  if (!form.valueSmartCriteria) errors.valueSmartCriteria = true
  if (!form.periodSmartCriteriaCatalogId) errors.periodSmartCriteriaCatalogId = true
  if (!form.valueDuration) errors.valueDuration = true
  if (!form.periodDurationCatalogId) errors.periodDurationCatalogId = true
  return errors
}

function createDefaultForm(): GenerateFormState {
  return {
    quantity: 1,
    startDate: "",
    estimatedEndDate: "",
    operatorSmartCriteria: "LTE",
    valueSmartCriteria: "",
    periodSmartCriteriaCatalogId: "",
    valueDuration: "",
    periodDurationCatalogId: "",
  }
}

interface GenerateObjectivesModalProps {
  open: boolean
  onClose: () => void
  existingCount: number
  onGenerate: (objectives: ObjectiveRow[]) => void
  periodSelectOptions: { value: string; label: string }[]
}

export function GenerateObjectivesModal({
  open,
  onClose,
  existingCount,
  onGenerate,
  periodSelectOptions,
}: GenerateObjectivesModalProps) {
  const [form, setForm] = useState<GenerateFormState>(createDefaultForm())
  const [fieldErrors, setFieldErrors] = useState<GenerateFieldErrors>({})

  useEffect(() => {
    if (open) {
      setForm(createDefaultForm())
      setFieldErrors({})
    }
  }, [open])

  const update = useCallback(
    <K extends keyof GenerateFormState>(field: K, value: GenerateFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setFieldErrors((prev) => {
        if (!(field in prev)) return prev
        const next = { ...prev }
        delete next[field as GenerateFieldErrorKey]
        return next
      })
    },
    []
  )

  const handleQuantityChange = useCallback(
    (delta: number) => {
      setForm((prev) => ({
        ...prev,
        quantity: Math.max(1, Math.min(50, prev.quantity + delta)),
      }))
      setFieldErrors((prev) => {
        if (!("quantity" in prev)) return prev
        const next = { ...prev }
        delete next.quantity
        return next
      })
    },
    []
  )

  const handleGenerate = useCallback(() => {
    const errors = validateGenerateForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const generated: ObjectiveRow[] = []
    for (let i = 0; i < form.quantity; i++) {
      generated.push({
        localId: crypto.randomUUID(),
        name: `STO ${existingCount + i + 1}`,
        startDate: form.startDate,
        estimatedEndDate: form.estimatedEndDate,
        endDate: "",
        operatorSmartCriteria: form.operatorSmartCriteria,
        valueSmartCriteria: form.valueSmartCriteria,
        periodSmartCriteriaCatalogId: form.periodSmartCriteriaCatalogId,
        valueDuration: form.valueDuration,
        periodDurationCatalogId: form.periodDurationCatalogId,
      })
    }

    onGenerate(generated)
    onClose()
  }, [form, existingCount, onGenerate, onClose])

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => { if (!next) onClose() }}
      title="Generate Objectives"
      maxWidthClassName="sm:max-w-[640px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      <div className="px-6 py-5 space-y-5">
        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-600">
            Number of objectives to generate
          </label>
          <div className="flex items-center gap-2 w-fit">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => {
                const val = Math.max(1, Math.min(50, Number(e.target.value) || 1))
                update("quantity", val)
              }}
              className={`w-16 h-9 text-center text-sm font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                fieldErrors.quantity ? "border-red-400 ring-1 ring-red-200" : "border-gray-200"
              }`}
            />
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Names will be: STO {existingCount + 1}
            {form.quantity > 1 && <> — STO {existingCount + form.quantity}</>}
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <PremiumDatePicker
            label="Start Date"
            value={form.startDate}
            onChange={(v) => update("startDate", v)}
            required
            hasError={!!fieldErrors.startDate}
          />
          <PremiumDatePicker
            label="Estimated End Date"
            value={form.estimatedEndDate}
            onChange={(v) => update("estimatedEndDate", v)}
          />
        </div>

        {/* Smart Criteria */}
        <div>
          <div className="grid grid-cols-[120px_1fr_1fr] gap-3">
            <FloatingSelect
              label="Smart Criteria"
              value={form.operatorSmartCriteria}
              onChange={(v) => update("operatorSmartCriteria", v)}
              options={OPERATOR_SMART_CRITERIA_OPTIONS}
              required
              hasError={!!fieldErrors.operatorSmartCriteria}
            />
            <FloatingInput
              label="Value"
              value={form.valueSmartCriteria}
              onChange={(v) => update("valueSmartCriteria", v.replace(/[^0-9.-]/g, ""))}
              onBlur={() => {}}
              inputMode="numeric"
              required
              hasError={!!fieldErrors.valueSmartCriteria}
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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleGenerate}>
          Generate {form.quantity} {form.quantity === 1 ? "objective" : "objectives"}
        </Button>
      </div>
    </CustomModal>
  )
}
