"use client"

import { useState } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { ChevronDown, FileText } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { RatesSection } from "./RatesSection"
import type { PayerFullFormValues } from "@/lib/schemas/payer-form.schema"
import type { LocalInsurancePlanRate } from "@/lib/types/payer.types"
import { cn } from "@/lib/utils"

interface PlanSectionProps {
  form: UseFormReturn<PayerFullFormValues>
  rates: LocalInsurancePlanRate[]
  onAddRate: () => void
  onEditRate: (entry: LocalInsurancePlanRate) => void
  onDeleteRate: (entry: LocalInsurancePlanRate) => void
  planTypes: Array<{ id: string; name: string }>
  isLoadingPlanTypes: boolean
  defaultExpanded?: boolean
}

export function PlanSection({
  form,
  rates,
  onAddRate,
  onEditRate,
  onDeleteRate,
  planTypes,
  isLoadingPlanTypes,
  defaultExpanded = false,
}: PlanSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const planTypeOptions = planTypes.map((p) => ({ value: p.id, label: p.name }))

  return (
    <div>
      {/* Collapsible Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <FileText className="w-5 h-5 text-purple-700" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900">Insurance Plan</h3>
            <p className="text-sm text-gray-500">Plan details and billing rates</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible Content */}
      {expanded && (
        <div className="space-y-6">
          {/* Plan Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan Name */}
            <Controller
              name="planName"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Plan Name"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                    autoComplete="off"
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            {/* Insurance Plan Type */}
            <Controller
              name="insurancePlanTypeId"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingSelect
                    label="Plan Type"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={planTypeOptions}
                    hasError={!!fieldState.error}
                    disabled={isLoadingPlanTypes}
                    searchable
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            {/* Plan Comments — full width */}
            <div className="md:col-span-2">
              <Controller
                name="planComments"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingTextarea
                      label="Plan Comments"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      rows={3}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/60" />

          {/* Rates Sub-header */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Rates</h4>
            <RatesSection
              entries={rates}
              onAdd={onAddRate}
              onEdit={onEditRate}
              onDelete={onDeleteRate}
            />
          </div>
        </div>
      )}
    </div>
  )
}
