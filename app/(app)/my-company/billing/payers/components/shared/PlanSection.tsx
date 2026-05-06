"use client"

import { useEffect, useState, type RefObject } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { ChevronDown, FileText, X } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { RatesSection } from "./RatesSection"
import type { PayerFullFormValues } from "@/lib/schemas/payer-form.schema"
import type { LocalInsurancePlanRate } from "@/lib/types/payer.types"
import { cn } from "@/lib/utils"

interface PlanSectionProps {
  form: UseFormReturn<PayerFullFormValues>
  planIndex: number
  title?: string
  rates: LocalInsurancePlanRate[]
  onAddRate: () => void
  onEditRate: (entry: LocalInsurancePlanRate) => void
  onDeleteRate: (entry: LocalInsurancePlanRate) => void
  onRemovePlan?: () => void
  canRemovePlan?: boolean
  planTypes: Array<{ id: string; name: string }>
  isLoadingPlanTypes: boolean
  defaultExpanded?: boolean
  ratesSectionRef?: RefObject<HTMLDivElement | null>
  ratesError?: boolean
}

export function PlanSection({
  form,
  planIndex,
  title,
  rates,
  onAddRate,
  onEditRate,
  onDeleteRate,
  onRemovePlan,
  canRemovePlan = false,
  planTypes,
  isLoadingPlanTypes,
  defaultExpanded = false,
  ratesSectionRef,
  ratesError = false,
}: PlanSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  useEffect(() => {
    if (ratesError) setExpanded(true)
  }, [ratesError])

  const planTypeOptions = planTypes.map((p) => ({ value: p.id, label: p.name }))
  const planName = form.watch(`payerPlans.${planIndex}.planName` as const)
  const selectedPlanTypeId = form.watch(`payerPlans.${planIndex}.insurancePlanTypeId` as const)
  const selectedPlanTypeName = planTypes.find((p) => p.id === selectedPlanTypeId)?.name ?? ""
  const planSummary = [planName?.trim(), selectedPlanTypeName?.trim()].filter(Boolean).join(" · ")

  return (
    <div className="relative">
      {/* Collapsible Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <FileText className="w-5 h-5 text-purple-700" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900">{title ?? "Insurance Plan"}</h3>
            <p className="text-sm text-gray-500">{planSummary || "Plan details and billing rates"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRemovePlan ? (
            <button
              type="button"
              onClick={onRemovePlan}
              disabled={!canRemovePlan}
              className={cn(
                "w-9 h-9 rounded-xl",
                "flex items-center justify-center",
                "border transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 focus-visible:ring-offset-2",
                canRemovePlan
                  ? "bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-400 hover:text-slate-700 hover:scale-105 active:scale-95"
                  : "cursor-not-allowed bg-slate-50 border-slate-200/60 text-slate-300"
              )}
              title={canRemovePlan ? "Remove this plan" : "At least one plan is required"}
              aria-label={canRemovePlan ? "Remove plan" : "Cannot remove last plan"}
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded p-1"
            aria-label={expanded ? "Collapse plan section" : "Expand plan section"}
          >
            <ChevronDown
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {expanded && (
        <div className="space-y-6">
          {/* Plan Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan Name */}
            <Controller
              name={`payerPlans.${planIndex}.planName` as const}
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
                    required
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            {/* Insurance Plan Type */}
            <Controller
              name={`payerPlans.${planIndex}.insurancePlanTypeId` as const}
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
                    required
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/60" />

          {/* Rates — same required UX as Prior Auth billing codes */}
          <div ref={ratesSectionRef}>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Rates <span className="text-[#037ECC]">*</span>
            </h4>
            <RatesSection
              entries={rates}
              onAdd={onAddRate}
              onEdit={onEditRate}
              onDelete={onDeleteRate}
              hasError={ratesError}
            />
            {ratesError && (
              <p className="mt-2 text-sm text-red-600">At least one rate is required</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
