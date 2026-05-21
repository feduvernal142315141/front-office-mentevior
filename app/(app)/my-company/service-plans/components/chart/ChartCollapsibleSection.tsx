"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Download } from "lucide-react"
import {
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form"

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

import {
  CHART_DATASET_OPTIONS,
  ChartDataset,
  DEFAULT_CHART_CONFIG,
  DEFAULT_Y_AXIS_ID,
  createDefaultDatasetVisualConfig,
} from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"

const STATIC_TABS = {
  GENERAL: "general",
  X_AXIS: "x-axis",
  Y_AXES: "y-axes",
} as const

function datasetTabId(dataset: ChartDataset): string {
  return `dataset:${dataset}`
}

function parseDatasetTabId(tabId: string): ChartDataset | null {
  if (!tabId.startsWith("dataset:")) return null
  const value = tabId.slice("dataset:".length) as ChartDataset
  return Object.values(ChartDataset).includes(value) ? value : null
}

interface ChartCollapsibleSectionProps {
  control: Control<DataCollectionFormValues>
  setValue: UseFormSetValue<DataCollectionFormValues>
  getValues: UseFormGetValues<DataCollectionFormValues>
  mode: "category" | "item"
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadFromCategory?: () => void
}

export function ChartCollapsibleSection({
  control,
  setValue,
  getValues,
  mode,
  open,
  onOpenChange,
  onLoadFromCategory,
}: ChartCollapsibleSectionProps) {
  const [activeTab, setActiveTab] = useState(STATIC_TABS.GENERAL)
  const sectionRef = useRef<HTMLDivElement>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (nextOpen) {
      window.setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        })
      }, 80)
    }
  }

  const selectedDatasets = useWatch({ control, name: "chart.datasets" }) ?? []

  const datasetTabs = useMemo(
    () =>
      CHART_DATASET_OPTIONS.filter((option) => selectedDatasets.includes(option.value)).map(
        (option) => ({
          id: datasetTabId(option.value),
          label: option.label,
          dataset: option.value,
        })
      ),
    [selectedDatasets]
  )

  const tabs: ChartTab[] = useMemo(
    () => [
      { id: STATIC_TABS.GENERAL, label: "General" },
      { id: STATIC_TABS.X_AXIS, label: "X Axes" },
      { id: STATIC_TABS.Y_AXES, label: "Y Axes" },
      ...datasetTabs.map(({ id, label }) => ({ id, label })),
    ],
    [datasetTabs]
  )

  const activeDataset = parseDatasetTabId(activeTab)

  useEffect(() => {
    const validTabIds = new Set(tabs.map((tab) => tab.id))
    if (!validTabIds.has(activeTab)) {
      setActiveTab(STATIC_TABS.GENERAL)
    }
  }, [tabs, activeTab])

  useEffect(() => {
    if (!open || selectedDatasets.length === 0) return

    const yAxes = getValues("chart.yAxes")
    const defaultAxisId = yAxes?.[0]?.id ?? DEFAULT_Y_AXIS_ID
    const configs = getValues("chart.datasetConfigs") ?? {}

    for (const dataset of selectedDatasets) {
      if (dataset === ChartDataset.OBJECTIVES) {
        if (!getValues("chart.objectives")) {
          setValue("chart.objectives", DEFAULT_CHART_CONFIG.objectives!, {
            shouldDirty: false,
          })
        }
        continue
      }

      if (!configs[dataset]) {
        setValue(
          `chart.datasetConfigs.${dataset}`,
          createDefaultDatasetVisualConfig(dataset, defaultAxisId),
          { shouldDirty: false }
        )
      }
    }
  }, [selectedDatasets, open, setValue, getValues])

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

          <ChartTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

          <div className="pt-4">
            {activeTab === STATIC_TABS.GENERAL && <ChartGeneralTab control={control} />}
            {activeTab === STATIC_TABS.X_AXIS && <ChartXAxisTab control={control} />}
            {activeTab === STATIC_TABS.Y_AXES && <ChartYAxesTab control={control} />}
            {activeDataset === ChartDataset.OBJECTIVES && (
              <ChartObjectivesTab control={control} />
            )}
            {activeDataset &&
              activeDataset !== ChartDataset.OBJECTIVES &&
              selectedDatasets.includes(activeDataset) && (
                <ChartDatasetTab
                  control={control}
                  dataset={activeDataset}
                  showUnpin={activeDataset === ChartDataset.BASELINE}
                />
              )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
