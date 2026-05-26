"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  useFormState,
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form"

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
  DEFAULT_CHART_CONFIG,
  normalizeDatasetVisualConfig,
  isBaselineDataset,
  isObjectivesDataset,
  isStackedDataset,
  pruneChartDatasetConfigs,
} from "@/lib/modules/service-plans/constants/chart.constants"
import { useDatasetsCatalog } from "@/lib/modules/service-plans/hooks/use-datasets-catalog"
import type { DatasetCatalogEntry } from "@/lib/modules/service-plans/services/datasets-catalog.service"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"
import { hasChartSectionErrors } from "@/lib/schemas/data-collection-form.schema"
import {
  CHART_DATASET_TAB_PREFIX,
  CHART_STATIC_TABS,
  chartDatasetTabId,
  getChartTabsWithErrors,
  getFirstChartErrorTab,
} from "@/lib/schemas/chart-form-errors"

function parseDatasetTabId(tabId: string): string | null {
  if (!tabId.startsWith(CHART_DATASET_TAB_PREFIX)) return null
  return tabId.slice(CHART_DATASET_TAB_PREFIX.length)
}

interface ChartCollapsibleSectionProps {
  control: Control<DataCollectionFormValues>
  setValue: UseFormSetValue<DataCollectionFormValues>
  getValues: UseFormGetValues<DataCollectionFormValues>
  open: boolean
  onOpenChange: (open: boolean) => void
  focusToken?: number
}

export function ChartCollapsibleSection({
  control,
  setValue,
  getValues,
  open,
  onOpenChange,
  focusToken = 0,
}: ChartCollapsibleSectionProps) {
  const [activeTab, setActiveTab] = useState<string>(CHART_STATIC_TABS.GENERAL)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { errors } = useFormState({ control })
  const chartErrors = errors.chart as Record<string, unknown> | undefined
  const hasChartErrors = hasChartSectionErrors(errors)

  const {
    entries: datasetEntries,
    isLoading: isDatasetsLoading,
    error: datasetsError,
    refetch: refetchDatasets,
  } = useDatasetsCatalog(open)

  const datasetById = useMemo(() => {
    const map = new Map<string, DatasetCatalogEntry>()
    for (const entry of datasetEntries) {
      map.set(entry.id, entry)
    }
    return map
  }, [datasetEntries])

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
      datasetEntries
        .filter((entry) => selectedDatasets.includes(entry.id))
        .map((entry) => ({
          id: chartDatasetTabId(entry.id),
          label: entry.name,
          datasetId: entry.id,
          datasetName: entry.name,
        })),
    [datasetEntries, selectedDatasets]
  )

  const objectivesDatasetId = useMemo(() => {
    for (const id of selectedDatasets) {
      const entry = datasetById.get(id)
      if (entry && isObjectivesDataset(entry.name)) return id
    }
    return undefined
  }, [selectedDatasets, datasetById])

  const tabsWithErrors = useMemo(
    () =>
      getChartTabsWithErrors(chartErrors, {
        objectivesDatasetId,
        selectedDatasetIds: selectedDatasets,
      }),
    [chartErrors, objectivesDatasetId, selectedDatasets]
  )

  const tabs: ChartTab[] = useMemo(
    () => [
      {
        id: CHART_STATIC_TABS.GENERAL,
        label: "General",
        hasError: tabsWithErrors.has(CHART_STATIC_TABS.GENERAL),
      },
      {
        id: CHART_STATIC_TABS.X_AXIS,
        label: "X Axes",
        hasError: tabsWithErrors.has(CHART_STATIC_TABS.X_AXIS),
      },
      {
        id: CHART_STATIC_TABS.Y_AXES,
        label: "Y Axes",
        hasError: tabsWithErrors.has(CHART_STATIC_TABS.Y_AXES),
      },
      ...datasetTabs.map(({ id, label }) => ({
        id,
        label,
        hasError: tabsWithErrors.has(id),
      })),
    ],
    [datasetTabs, tabsWithErrors]
  )

  const activeDatasetId = parseDatasetTabId(activeTab)
  const activeDataset = activeDatasetId ? datasetById.get(activeDatasetId) : undefined

  useEffect(() => {
    const validTabIds = new Set(tabs.map((tab) => tab.id))
    if (!validTabIds.has(activeTab)) {
      setActiveTab(CHART_STATIC_TABS.GENERAL)
    }
  }, [tabs, activeTab])

  useEffect(() => {
    if (!focusToken || !hasChartErrors) return

    const nextTab = getFirstChartErrorTab(chartErrors, {
      objectivesDatasetId,
      selectedDatasetIds: selectedDatasets,
    })
    setActiveTab(nextTab)

    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    }, 120)
  }, [focusToken, hasChartErrors, chartErrors, objectivesDatasetId, selectedDatasets])

  useEffect(() => {
    const chart = getValues("chart")
    if (!chart?.datasetConfigs) return

    const pruned = pruneChartDatasetConfigs(chart)
    const currentKeys = Object.keys(chart.datasetConfigs).sort().join(",")
    const prunedKeys = Object.keys(pruned.datasetConfigs ?? {}).sort().join(",")
    if (currentKeys !== prunedKeys) {
      setValue("chart.datasetConfigs", pruned.datasetConfigs, { shouldDirty: false })
    }
  }, [selectedDatasets, getValues, setValue])

  useEffect(() => {
    if (!open || selectedDatasets.length === 0 || datasetEntries.length === 0) return

    const yAxisTitle = getValues("chart.yAxis.title") ?? ""
    const configs = getValues("chart.datasetConfigs") ?? {}

    for (const datasetId of selectedDatasets) {
      const entry = datasetById.get(datasetId)
      if (!entry) continue

      if (isObjectivesDataset(entry.name)) {
        if (!getValues("chart.objectives")) {
          setValue("chart.objectives", DEFAULT_CHART_CONFIG.objectives!, {
            shouldDirty: false,
          })
        }
        continue
      }

      const nextConfig = normalizeDatasetVisualConfig(
        configs[datasetId],
        entry.name,
        yAxisTitle
      )
      const current = configs[datasetId]
      const shouldSync =
        !current || JSON.stringify(current) !== JSON.stringify(nextConfig)

      if (shouldSync) {
        setValue(`chart.datasetConfigs.${datasetId}`, nextConfig, {
          shouldDirty: false,
        })
      }
    }
  }, [selectedDatasets, datasetById, datasetEntries.length, open, setValue, getValues])

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      ref={sectionRef}
      className={cn(
        "group scroll-mt-4 rounded-xl border bg-white",
        hasChartErrors ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
      )}
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
          <ChartTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

          <div className="pt-4">
            {activeTab === CHART_STATIC_TABS.GENERAL && (
              <ChartGeneralTab
                control={control}
                datasetEntries={datasetEntries}
                isDatasetsLoading={isDatasetsLoading}
                datasetsError={datasetsError}
                onRetryDatasets={() => void refetchDatasets()}
              />
            )}
            {activeTab === CHART_STATIC_TABS.X_AXIS && <ChartXAxisTab control={control} />}
            {activeTab === CHART_STATIC_TABS.Y_AXES && <ChartYAxesTab control={control} />}
            {activeDataset && isObjectivesDataset(activeDataset.name) && (
              <ChartObjectivesTab control={control} />
            )}
            {activeDataset &&
              !isObjectivesDataset(activeDataset.name) &&
              selectedDatasets.includes(activeDataset.id) && (
                <ChartDatasetTab
                  control={control}
                  setValue={setValue}
                  dataset={activeDataset.id}
                  showUnpin={isBaselineDataset(activeDataset.name)}
                  showStacked={isStackedDataset(activeDataset.name)}
                />
              )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
