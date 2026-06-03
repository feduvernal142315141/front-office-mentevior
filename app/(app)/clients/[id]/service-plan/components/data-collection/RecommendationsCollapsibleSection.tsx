"use client"

import { useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { useStrategyCatalog } from "@/lib/modules/client-service-plan/hooks/use-strategy-catalog"
import { useActivitiesImplementedCatalog } from "@/lib/modules/client-service-plan/hooks/use-activities-implemented-catalog"
import { usePreventiveStrategiesCatalog } from "@/lib/modules/client-service-plan/hooks/use-preventive-strategies-catalog"
import { useReplacementsCatalog } from "@/lib/modules/client-service-plan/hooks/use-replacements-catalog"
import { useInterventionsCatalog } from "@/lib/modules/client-service-plan/hooks/use-interventions-catalog"
import { useReinforcersCatalog } from "@/lib/modules/client-service-plan/hooks/use-reinforcers-catalog"
import type { RecommendationsConfig } from "@/lib/types/client-service-plan.types"

export type RecommendationFieldKey = keyof RecommendationsConfig

export type RecommendationErrors = Partial<Record<RecommendationFieldKey, string>>

export function validateRecommendations(
  rec: RecommendationsConfig,
  selectedStrategyName: string
): RecommendationErrors {
  const errors: RecommendationErrors = {}
  if (!rec.strategyId) errors.strategyId = "Strategy is required"
  if (!rec.activitiesToOccurrence?.length) errors.activitiesToOccurrence = "Activities implemented is required"
  if (!rec.preventiveStrategies?.length) errors.preventiveStrategies = "Preventive strategies is required"

  const lowerStrategy = selectedStrategyName.toLowerCase()
  if (lowerStrategy.includes("intervention")) {
    if (!rec.replacements?.length) errors.replacements = "Replacements is required"
    if (!rec.interventions?.length) errors.interventions = "Interventions is required"
  }
  if (lowerStrategy.includes("reinforcement")) {
    if (!rec.reinforcers?.length) errors.reinforcers = "Reinforcers is required"
  }
  return errors
}

interface RecommendationsCollapsibleSectionProps {
  value: RecommendationsConfig
  onChange: (value: RecommendationsConfig) => void
  errors?: RecommendationErrors
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-red-600">{message}</p>
}

export function RecommendationsCollapsibleSection({
  value,
  onChange,
  errors,
  open,
  onOpenChange,
}: RecommendationsCollapsibleSectionProps) {
  const strategy = useStrategyCatalog()
  const activities = useActivitiesImplementedCatalog()
  const preventive = usePreventiveStrategiesCatalog()
  const replacements = useReplacementsCatalog()
  const interventions = useInterventionsCatalog()
  const reinforcers = useReinforcersCatalog()

  const strategyOptions = strategy.items.map((item) => ({
    value: item.id,
    label: item.name,
  }))

  const selectedStrategyName = useMemo(() => {
    const item = strategy.items.find((i) => i.id === value.strategyId)
    return item?.name ?? ""
  }, [strategy.items, value.strategyId])

  const lowerStrategy = selectedStrategyName.toLowerCase()
  const showIntervention = lowerStrategy.includes("intervention")
  const showReinforcement = lowerStrategy.includes("reinforcement")

  const update = (patch: Partial<RecommendationsConfig>) =>
    onChange({ ...value, ...patch })

  const hasAnyError = errors && Object.values(errors).some(Boolean)

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "group rounded-xl border bg-white",
        hasAnyError ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
      )}
    >
      <CollapsibleTrigger
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/20"
      >
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Recommendations
        </h3>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-visible border-t border-slate-100">
        <div className="space-y-5 px-4 py-5">
          {/* Strategy (single select) — always visible */}
          <div className="space-y-1">
            <FloatingSelect
              label="Strategy"
              value={value.strategyId ?? ""}
              onChange={(v) => update({ strategyId: v })}
              options={strategyOptions}
              disabled={strategy.isLoading}
              hasError={!!errors?.strategyId}
              required
            />
            <FieldErrorText message={errors?.strategyId} />
          </div>

          {/* Activities Implemented — always visible */}
          <div className="space-y-1">
            <MultiSelectWithSearch
              label="Activities Implemented"
              items={activities.items}
              selectedIds={value.activitiesToOccurrence ?? []}
              onChange={(ids) => update({ activitiesToOccurrence: ids })}
              isLoading={activities.isLoading}
              allowCreate
              onCreate={activities.create}
              hasError={!!errors?.activitiesToOccurrence}
              required
            />
            <FieldErrorText message={errors?.activitiesToOccurrence} />
          </div>

          {/* Preventive Strategies — always visible */}
          <div className="space-y-1">
            <MultiSelectWithSearch
              label="Preventive Strategies"
              items={preventive.items}
              selectedIds={value.preventiveStrategies ?? []}
              onChange={(ids) => update({ preventiveStrategies: ids })}
              isLoading={preventive.isLoading}
              allowCreate
              onCreate={preventive.create}
              hasError={!!errors?.preventiveStrategies}
              required
            />
            <FieldErrorText message={errors?.preventiveStrategies} />
          </div>

          {/* Replacements — only if Strategy includes "Intervention" */}
          {showIntervention && (
            <div className="space-y-1">
              <MultiSelectWithSearch
                label="Replacements"
                items={replacements.items}
                selectedIds={value.replacements ?? []}
                onChange={(ids) => update({ replacements: ids })}
                isLoading={replacements.isLoading}
                hasError={!!errors?.replacements}
                required
              />
              <FieldErrorText message={errors?.replacements} />
            </div>
          )}

          {/* Interventions — only if Strategy includes "Intervention" */}
          {showIntervention && (
            <div className="space-y-1">
              <MultiSelectWithSearch
                label="Interventions"
                items={interventions.items}
                selectedIds={value.interventions ?? []}
                onChange={(ids) => update({ interventions: ids })}
                isLoading={interventions.isLoading}
                allowCreate
                onCreate={interventions.create}
                hasError={!!errors?.interventions}
                required
              />
              <FieldErrorText message={errors?.interventions} />
            </div>
          )}

          {/* Reinforcers — only if Strategy includes "Reinforcement" */}
          {showReinforcement && (
            <div className="space-y-1">
              <MultiSelectWithSearch
                label="Reinforcers"
                items={reinforcers.items}
                selectedIds={value.reinforcers ?? []}
                onChange={(ids) => update({ reinforcers: ids })}
                isLoading={reinforcers.isLoading}
                grouped
                hasError={!!errors?.reinforcers}
                required
              />
              <FieldErrorText message={errors?.reinforcers} />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
