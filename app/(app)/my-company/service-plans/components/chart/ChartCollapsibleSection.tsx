"use client"

import { useMemo, useRef, useState } from "react"
import { ChevronDown, Download } from "lucide-react"
import { useWatch, type Control } from "react-hook-form"

import { Button } from "@/components/custom/Button"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { ChartTabs, type ChartTab } from "./ChartTabs"
import { ChartGeneralTab } from "./ChartGeneralTab"
import { ChartXAxisTab } from "./ChartXAxisTab"
import { ChartYAxesTab } from "./ChartYAxesTab"
import { ChartDatasetTab } from "./ChartDatasetTab"
import { ChartObjectivesTab } from "./ChartObjectivesTab"

import { ChartDataset } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"

const TABS = {
  GENERAL: "general",
  X_AXIS: "x-axis",
  Y_AXES: "y-axes",
  BASELINE: "baseline",
  TOTAL: "total",
  OBJECTIVES: "objectives",
} as const

type TabId = (typeof TABS)[keyof typeof TABS]

interface ChartCollapsibleSectionProps {
  control: Control<DataCollectionFormValues>
  mode: "category" | "item"
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadFromCategory?: () => void
}

export function ChartCollapsibleSection({
  control,
  mode,
  open,
  onOpenChange,
  onLoadFromCategory,
}: ChartCollapsibleSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>(TABS.GENERAL)
  const sectionRef = useRef<HTMLDivElement>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (nextOpen) {
      // Premium UX: wait for the expand animation to start, then bring the
      // chart section's header to the top of the drawer's scroll area so the
      // content is visible without manual scrolling.
      window.setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        })
      }, 80)
    }
  }

  const selectedDatasets = useWatch({ control, name: "chart.datasets" }) ?? []

  const hasBaseline = selectedDatasets.includes(ChartDataset.BASELINE)
  const hasTotal = selectedDatasets.includes(ChartDataset.TOTAL)
  const hasObjectives = selectedDatasets.includes(ChartDataset.OBJECTIVES)

  const tabs: ChartTab[] = useMemo(
    () => [
      { id: TABS.GENERAL, label: "General" },
      { id: TABS.X_AXIS, label: "X Axes" },
      { id: TABS.Y_AXES, label: "Y Axes" },
      {
        id: TABS.BASELINE,
        label: "Baseline",
        disabled: !hasBaseline,
        disabledHint: "Select Baseline dataset in General first",
      },
      {
        id: TABS.TOTAL,
        label: "Total",
        disabled: !hasTotal,
        disabledHint: "Select Total dataset in General first",
      },
      {
        id: TABS.OBJECTIVES,
        label: "Objectives",
        disabled: !hasObjectives,
        disabledHint: "Select Objectives dataset in General first",
      },
    ],
    [hasBaseline, hasTotal, hasObjectives]
  )

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      ref={sectionRef}
      className="group scroll-mt-4 rounded-xl border border-slate-200 bg-white"
    >
      <CollapsibleTrigger
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/20"
        aria-label={open ? "Collapse chart" : "Expand chart"}
      >
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Chart
          </h3>
          {selectedDatasets.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {selectedDatasets.length} dataset{selectedDatasets.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-visible border-t border-slate-100">
        <div className="space-y-5 px-4 py-5">
          {/* Top bar — Load from Category (item mode only) */}
          {mode === "item" && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={onLoadFromCategory}
                disabled={!onLoadFromCategory}
              >
                <Download className="h-4 w-4" />
                Load from Category
              </Button>
            </div>
          )}

          <ChartTabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

          <div className="pt-4">
            {activeTab === TABS.GENERAL && <ChartGeneralTab control={control} />}
            {activeTab === TABS.X_AXIS && <ChartXAxisTab control={control} />}
            {activeTab === TABS.Y_AXES && <ChartYAxesTab control={control} />}
            {activeTab === TABS.BASELINE && hasBaseline && (
              <ChartDatasetTab control={control} field="baseline" showUnpin />
            )}
            {activeTab === TABS.TOTAL && hasTotal && (
              <ChartDatasetTab control={control} field="total" />
            )}
            {activeTab === TABS.OBJECTIVES && hasObjectives && (
              <ChartObjectivesTab control={control} />
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
