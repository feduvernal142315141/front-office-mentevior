"use client"

import { FolderOpen, Loader2, RotateCcw } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { INTENSITY_KEY_OPTIONS } from "@/lib/constants/assessment.constants"
import { HYPOTHESIZED_FUNCTION_OPTIONS } from "@/lib/constants/hypothesized-function"
import { typeIsFrequency } from "@/lib/modules/service-plans/constants/data-collection.constants"
import type { ClientCategoryWithItems } from "@/lib/types/assessment.types"
import {
  EMPTY_CATEGORY_ITEM,
  type CategoryItemFormValue,
} from "../../hooks/useAssessmentForm"

interface CategoryItemsSectionProps {
  clientSelected: boolean
  categories: ClientCategoryWithItems[]
  /**
   * Nombre del método de colección por item id. Intensity e Intensity description
   * sólo aplican a items Frequency; un item sin entrada (método desconocido) los muestra.
   */
  collectionMethodByItemId?: Record<string, string>
  /**
   * Valor inicial por item, configurado en el Client Service Plan. Se muestra
   * mientras el usuario no elija otro; cambiarlo acá no toca el Service Plan.
   */
  hypothesizedFunctionByItemId?: Record<string, string>
  isLoading: boolean
  values: Record<string, CategoryItemFormValue>
  /** Pinta los empty states en rojo cuando la sección exige al menos un item evaluado */
  hasError?: boolean
  disabled?: boolean
  onUpdate: (itemId: string, field: keyof CategoryItemFormValue, value: string) => void
  onClear: (itemId: string) => void
}

function isTouched(value: CategoryItemFormValue): boolean {
  return (
    !!value.intensityKey ||
    !!value.intensityDescription.trim() ||
    !!value.hypothesizedFunction ||
    !!value.prevalentSetting.trim() ||
    !!value.preventiveStrategies.trim() ||
    !!value.managementStrategies.trim()
  )
}

/**
 * Evaluación por item del Service Plan activo del cliente: intensidad,
 * descripción y función hipotetizada. Sólo los items tocados viajan al backend.
 */
export function CategoryItemsSection({
  clientSelected,
  categories,
  collectionMethodByItemId = {},
  hypothesizedFunctionByItemId = {},
  isLoading,
  values,
  hasError,
  disabled,
  onUpdate,
  onClear,
}: CategoryItemsSectionProps) {
  if (!clientSelected) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
        <FolderOpen className={`h-6 w-6 ${hasError ? "text-red-300" : "text-slate-300"}`} />
        <p className="text-sm text-slate-500">Select a client to load their service plan items</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#037ECC]" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
        <FolderOpen className={`h-6 w-6 ${hasError ? "text-red-300" : "text-slate-300"}`} />
        <p className="text-sm font-medium text-slate-600">No active service plan</p>
        <p className="max-w-md text-center text-sm text-slate-500">
          This client has no active service plan with categories, so there are no items to evaluate.
          You can still save the assessment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id}>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {category.name}
          </h4>
          <div className="space-y-3">
            {category.items.map((item) => {
              const value = values[item.id] ?? EMPTY_CATEGORY_ITEM
              const touched = isTouched(value)
              const collectionMethod = collectionMethodByItemId[item.id]
              const showIntensity = !collectionMethod || typeIsFrequency(collectionMethod)
              // Precarga del Service Plan: se muestra hasta que el usuario elija otra
              const hypothesizedFunction = hypothesizedFunctionByItemId[item.id]

              return (
                <div
                  key={item.id}
                  data-field={`category-item-${item.id}`}
                  className={`rounded-xl border p-4 transition-colors ${
                    touched ? "border-[#037ECC]/30 bg-[#037ECC]/[0.03]" : "border-slate-200 bg-slate-50/40"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{item.name}</span>
                    {touched && (
                      <button
                        type="button"
                        onClick={() => onClear(item.id)}
                        disabled={disabled}
                        className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-red-500 disabled:opacity-50"
                        title="Clear this item's evaluation"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  {showIntensity && (
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                      <FloatingSelect
                        label="Intensity"
                        value={value.intensityKey}
                        onChange={(v) => onUpdate(item.id, "intensityKey", v)}
                        options={INTENSITY_KEY_OPTIONS}
                        disabled={disabled}
                      />
                      <FloatingInput
                        label="Intensity description"
                        value={value.intensityDescription}
                        onChange={(v) => onUpdate(item.id, "intensityDescription", v)}
                        onBlur={() => {}}
                        disabled={disabled}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FloatingSelect
                      label="Hypothesized function"
                      value={value.hypothesizedFunction || hypothesizedFunction || ""}
                      onChange={(v) => onUpdate(item.id, "hypothesizedFunction", v)}
                      options={HYPOTHESIZED_FUNCTION_OPTIONS}
                      disabled={disabled}
                    />
                    <FloatingInput
                      label="Prevalent setting"
                      value={value.prevalentSetting}
                      onChange={(v) => onUpdate(item.id, "prevalentSetting", v)}
                      onBlur={() => {}}
                      disabled={disabled}
                    />
                    <FloatingInput
                      label="Preventive strategies (antecedent)"
                      value={value.preventiveStrategies}
                      onChange={(v) => onUpdate(item.id, "preventiveStrategies", v)}
                      onBlur={() => {}}
                      disabled={disabled}
                    />
                    <FloatingInput
                      label="Management strategies (consequence)"
                      value={value.managementStrategies}
                      onChange={(v) => onUpdate(item.id, "managementStrategies", v)}
                      onBlur={() => {}}
                      disabled={disabled}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
