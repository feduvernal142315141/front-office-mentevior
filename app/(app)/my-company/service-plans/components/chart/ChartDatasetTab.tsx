"use client"

import { Controller, useWatch, type Control } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingColorPicker } from "@/components/custom/FloatingColorPicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import {
  CHART_LINE_TYPE_OPTIONS,
  POINT_STYLE_OPTIONS,
  type ChartDataset,
} from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"
import { cn } from "@/lib/utils"

interface ChartDatasetTabProps {
  control: Control<DataCollectionFormValues>
  dataset: ChartDataset
  showUnpin?: boolean
}

export function ChartDatasetTab({ control, dataset, showUnpin }: ChartDatasetTabProps) {
  const yAxes = useWatch({ control, name: "chart.yAxes" }) ?? []
  const axisOptions = yAxes.map((a) => ({
    value: a.id,
    label: a.title || "(untitled)",
  }))

  const base = `chart.datasetConfigs.${dataset}` as const

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
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
          name={`${base}.axisId`}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6">
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

      <div
        className={cn(
          "grid gap-4",
          showUnpin ? "grid-cols-3" : "grid-cols-2"
        )}
      >
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
    </div>
  )
}
