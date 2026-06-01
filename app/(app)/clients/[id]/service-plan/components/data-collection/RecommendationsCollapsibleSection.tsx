"use client"

import { ChevronDown } from "lucide-react"
import { Controller, type Control } from "react-hook-form"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { useStrategyCatalog } from "@/lib/modules/client-service-plan/hooks/use-strategy-catalog"
import { useActivitiesImplementedCatalog } from "@/lib/modules/client-service-plan/hooks/use-activities-implemented-catalog"
import { usePreventiveStrategiesCatalog } from "@/lib/modules/client-service-plan/hooks/use-preventive-strategies-catalog"
import { useReplacementsCatalog } from "@/lib/modules/client-service-plan/hooks/use-replacements-catalog"
import { useInterventionsCatalog } from "@/lib/modules/client-service-plan/hooks/use-interventions-catalog"
import { useReinforcersCatalog } from "@/lib/modules/client-service-plan/hooks/use-reinforcers-catalog"
import type { ClientDataCollectionFormValues } from "@/lib/schemas/client-data-collection-form.schema"

type SelectionItem = { catalogItemId: string; customText?: string }

interface RecommendationsCollapsibleSectionProps {
  control: Control<ClientDataCollectionFormValues>
  open: boolean
  onOpenChange: (open: boolean) => void
  hasErrors: boolean
}

function selectionToIds(selections: SelectionItem[]): string[] {
  return selections.map((s) => s.catalogItemId)
}

function selectionToFillInValues(selections: SelectionItem[]): Record<string, string> {
  return Object.fromEntries(
    selections
      .filter((s) => s.customText !== undefined)
      .map((s) => [s.catalogItemId, s.customText ?? ""])
  )
}

function mergeSelectionChange(prev: SelectionItem[], newIds: string[]): SelectionItem[] {
  const prevMap = new Map(prev.map((s) => [s.catalogItemId, s]))
  return newIds.map((id) => prevMap.get(id) ?? { catalogItemId: id })
}

function mergeSelectionFillIn(prev: SelectionItem[], itemId: string, text: string): SelectionItem[] {
  return prev.map((s) =>
    s.catalogItemId === itemId ? { ...s, customText: text || undefined } : s
  )
}

export function RecommendationsCollapsibleSection({
  control,
  open,
  onOpenChange,
  hasErrors,
}: RecommendationsCollapsibleSectionProps) {
  const strategy = useStrategyCatalog()
  const activities = useActivitiesImplementedCatalog()
  const preventive = usePreventiveStrategiesCatalog()
  const replacements = useReplacementsCatalog()
  const interventions = useInterventionsCatalog()
  const reinforcers = useReinforcersCatalog()

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "group rounded-xl border bg-white",
        hasErrors ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
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
          {/* Strategy (read-only catalog) */}
          <Controller
            name="recommendations.strategyIds"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelectWithSearch
                label="Strategy"
                items={strategy.items}
                selectedIds={field.value ?? []}
                onChange={field.onChange}
                isLoading={strategy.isLoading}
              />
            )}
          />

          {/* Activities Implemented */}
          <Controller
            name="recommendations.activitiesImplemented"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelectWithSearch
                label="Activities Implemented"
                items={activities.items}
                selectedIds={selectionToIds(field.value ?? [])}
                onChange={(ids) =>
                  field.onChange(mergeSelectionChange(field.value ?? [], ids))
                }
                fillInBlankValues={selectionToFillInValues(field.value ?? [])}
                onFillInBlankChange={(itemId, text) =>
                  field.onChange(mergeSelectionFillIn(field.value ?? [], itemId, text))
                }
                isLoading={activities.isLoading}
                allowCreate
                onCreate={activities.create}
              />
            )}
          />

          {/* Preventive Strategies */}
          <Controller
            name="recommendations.preventiveStrategies"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelectWithSearch
                label="Preventive Strategies"
                items={preventive.items}
                selectedIds={selectionToIds(field.value ?? [])}
                onChange={(ids) =>
                  field.onChange(mergeSelectionChange(field.value ?? [], ids))
                }
                fillInBlankValues={selectionToFillInValues(field.value ?? [])}
                onFillInBlankChange={(itemId, text) =>
                  field.onChange(mergeSelectionFillIn(field.value ?? [], itemId, text))
                }
                isLoading={preventive.isLoading}
                allowCreate
                onCreate={preventive.create}
              />
            )}
          />

          {/* Replacements (read-only catalog) */}
          <Controller
            name="recommendations.replacements"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelectWithSearch
                label="Replacements"
                items={replacements.items}
                selectedIds={field.value ?? []}
                onChange={field.onChange}
                isLoading={replacements.isLoading}
              />
            )}
          />

          {/* Interventions */}
          <Controller
            name="recommendations.interventions"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelectWithSearch
                label="Interventions"
                items={interventions.items}
                selectedIds={selectionToIds(field.value ?? [])}
                onChange={(ids) =>
                  field.onChange(mergeSelectionChange(field.value ?? [], ids))
                }
                fillInBlankValues={selectionToFillInValues(field.value ?? [])}
                onFillInBlankChange={(itemId, text) =>
                  field.onChange(mergeSelectionFillIn(field.value ?? [], itemId, text))
                }
                isLoading={interventions.isLoading}
                allowCreate
                onCreate={interventions.create}
              />
            )}
          />

          {/* Reinforcers (grouped by group) */}
          <Controller
            name="recommendations.reinforcers"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <MultiSelectWithSearch
                label="Reinforcers"
                items={reinforcers.items}
                selectedIds={field.value ?? []}
                onChange={field.onChange}
                isLoading={reinforcers.isLoading}
                grouped
              />
            )}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
