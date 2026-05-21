"use client"

import { useEffect, useMemo } from "react"
import { Controller, useWatch, type Control } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingColorPicker } from "@/components/custom/FloatingColorPicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import {
  CHART_LINE_TYPE_OPTIONS,
  POINT_STYLE_OPTIONS,
} from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"
import { cn } from "@/lib/utils"
import type { UseFormSetValue } from "react-hook-form"

interface ChartDatasetTabProps {
  control: Control<DataCollectionFormValues>
  setValue: UseFormSetValue<DataCollectionFormValues>
  dataset: string
  showUnpin?: boolean
  showStacked?: boolean
}

export function ChartDatasetTab({
  control,
  setValue,
  dataset,
  showUnpin,
  showStacked,
}: ChartDatasetTabProps) {
  const yAxisTitle = useWatch({ control, name: "chart.yAxis.title" }) ?? ""
  const currentAxis = useWatch({
    control,
    name: `chart.datasetConfigs.${dataset}.axis`,
  })

  const axisOptions = useMemo(
    () => [{ value: yAxisTitle || "—", label: yAxisTitle || "(untitled)" }],
    [yAxisTitle]
  )

  useEffect(() => {
    if ((currentAxis ?? "") !== (yAxisTitle ?? "")) {
      setValue(`chart.datasetConfigs.${dataset}.axis`, yAxisTitle, {
        shouldDirty: false,
      })
    }
  }, [yAxisTitle, currentAxis, dataset, setValue])

  const base = `chart.datasetConfigs.${dataset}` as const
  const headerCols = showStacked || showUnpin ? "grid-cols-4" : "grid-cols-3"

  return (
    <div className="space-y-6">
      <div className={cn("grid gap-x-4 gap-y-6", headerCols)}>
        <Controller
          name={`${base}.title`}
          control={control}
          render={({ field: f }) => (
            <FloatingInput
              label="Title"
              value={f.value ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
            />
          )}
        />
        <Controller
          name={`${base}.axis`}
          control={control}
          render={({ field: f }) => (
            <FloatingSelect
              label="Axis"
              value={f.value ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
              options={axisOptions}
            />
          )}
        />
        <Controller
          name={`${base}.type`}
          control={control}
          render={({ field: f }) => (
            <FloatingSelect
              label="Type"
              value={f.value ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
              options={CHART_LINE_TYPE_OPTIONS}
            />
          )}
        />
        {showStacked && (
          <Controller
            name={`${base}.stacked`}
            control={control}
            render={({ field: f }) => (
              <div className="flex min-w-0 items-center justify-center">
                <PremiumSwitch
                  label="Stacked"
                  checked={!!f.value}
                  onCheckedChange={f.onChange}
                  variant="success"
                  compact
                />
              </div>
            )}
          />
        )}
        {showUnpin && (
          <Controller
            name={`${base}.unpin`}
            control={control}
            render={({ field: f }) => (
              <div className="flex min-w-0 items-center justify-center">
                <PremiumSwitch
                  label="Unpin"
                  checked={!!f.value}
                  onCheckedChange={f.onChange}
                  variant="success"
                  compact
                />
              </div>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-6">
        <Controller
          name={`${base}.pointStyle`}
          control={control}
          render={({ field: f }) => (
            <FloatingSelect
              label="Point Style"
              value={f.value ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
              options={POINT_STYLE_OPTIONS}
            />
          )}
        />
        <Controller
          name={`${base}.borderColor`}
          control={control}
          render={({ field: f }) => (
            <FloatingColorPicker
              label="Border Color"
              value={f.value ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
            />
          )}
        />
        <Controller
          name={`${base}.backgroundColor`}
          control={control}
          render={({ field: f }) => (
            <FloatingColorPicker
              label="Background Color"
              value={f.value ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
            />
          )}
        />
        <Controller
          name={`${base}.trendlineColor`}
          control={control}
          render={({ field: f }) => (
            <FloatingColorPicker
              label="Trendline color"
              value={f.value ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name={`${base}.spanGaps`}
          control={control}
          render={({ field: f }) => (
            <div className="flex min-w-0 items-center justify-center">
              <PremiumSwitch
                label="Span Gaps"
                checked={!!f.value}
                onCheckedChange={f.onChange}
                variant="success"
                compact
              />
            </div>
          )}
        />
        <Controller
          name={`${base}.showValues`}
          control={control}
          render={({ field: f }) => (
            <div className="flex min-w-0 items-center justify-center">
              <PremiumSwitch
                label="Show values"
                checked={!!f.value}
                onCheckedChange={f.onChange}
                variant="success"
                compact
              />
            </div>
          )}
        />
      </div>
    </div>
  )
}
