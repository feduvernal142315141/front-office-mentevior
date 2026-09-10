"use client"

import { useMemo } from "react"
import { FolderOpen, Loader2, RotateCcw } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { INTENSITY_KEY_OPTIONS } from "@/lib/constants/assessment.constants"
import { HYPOTHESIZED_FUNCTION_OPTIONS } from "@/lib/constants/hypothesized-function"
import { typeIsFrequency } from "@/lib/modules/service-plans/constants/data-collection.constants"
import type {
  ClientCategoryWithItems,
  HypothesizedFunction,
  IntensityCatalogItem,
} from "@/lib/types/assessment.types"
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
   * Valores iniciales por item, configurados en el Client Service Plan. Se muestran
   * mientras el usuario no elija otros; cambiarlos acá no toca el Service Plan.
   * Lista desde el contrato 2026-09-07.
   */
  hypothesizedFunctionByItemId?: Record<string, HypothesizedFunction[]>
  /** `GET /intensity/catalog` — name/description se guardan como strings en el assessment. */
  intensities?: IntensityCatalogItem[]
  isLoading: boolean
  values: Record<string, CategoryItemFormValue>
  /** Pinta los empty states en rojo cuando la sección exige al menos un item evaluado */
  hasError?: boolean
  disabled?: boolean
  onUpdate: (itemId: string, field: keyof CategoryItemFormValue, value: string | string[]) => void
  onClear: (itemId: string) => void
}

function isTouched(value: CategoryItemFormValue): boolean {
  return (
    !!value.intensityKey ||
    !!value.intensityDescription.trim() ||
    value.hypothesizedFunction.length > 0 ||
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
  intensities = [],
  isLoading,
  values,
  hasError,
  disabled,
  onUpdate,
  onClear,
}: CategoryItemsSectionProps) {
  const catalogDescriptions = useMemo(
    () => new Set(intensities.map((item) => item.description.trim()).filter(Boolean)),
    [intensities],
  )

  const intensityOptions = useMemo(() => {
    if (intensities.length === 0) return INTENSITY_KEY_OPTIONS
    return intensities.map((item) => ({ value: item.name, label: item.name }))
  }, [intensities])

  const descriptionByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of intensities) {
      map.set(item.name, item.description)
    }
    return map
  }, [intensities])

  const handleIntensityChange = (itemId: string, nextKey: string, current: CategoryItemFormValue) => {
    onUpdate(itemId, "intensityKey", nextKey)
    const catalogDescription = descriptionByName.get(nextKey)
    if (catalogDescription == null) return
    // Precarga del catálogo: sólo pisa si estaba vacío o era otra description del catálogo
    const trimmed = current.intensityDescription.trim()
    if (!trimmed || catalogDescriptions.has(trimmed)) {
      onUpdate(itemId, "intensityDescription", catalogDescription)
    }
  }

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
              // Precarga del Service Plan: se muestra hasta que el usuario elija otras
              const hypothesizedFunction = hypothesizedFunctionByItemId[item.id] ?? []

              const intensitySelectOptions =
                value.intensityKey && !intensityOptions.some((o) => o.value === value.intensityKey)
                  ? [...intensityOptions, { value: value.intensityKey, label: value.intensityKey }]
                  : intensityOptions

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
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
                      <FloatingSelect
                        label="Intensity"
                        value={value.intensityKey}
                        onChange={(v) => handleIntensityChange(item.id, v, value)}
                        options={intensitySelectOptions}
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
                    <MultiSelect
                      label="Hypothesized function"
                      value={
                        value.hypothesizedFunction.length > 0
                          ? value.hypothesizedFunction
                          : hypothesizedFunction
                      }
                      onChange={(v) => onUpdate(item.id, "hypothesizedFunction", v)}
                      options={HYPOTHESIZED_FUNCTION_OPTIONS}
                      disabled={disabled}
                      tone="neutral"
                      placeholder="Select functions"
                      maxVisibleTags={2}
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
