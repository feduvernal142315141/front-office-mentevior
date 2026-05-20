"use client"

import { Controller, type Control } from "react-hook-form"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { CHART_INTERVAL_OPTIONS } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"
import { DatasetChips } from "./DatasetChips"

interface ChartGeneralTabProps {
  control: Control<DataCollectionFormValues>
}

export function ChartGeneralTab({ control }: ChartGeneralTabProps) {
  return (
    <div className="space-y-6">
      <Controller
        name="chart.datasets"
        control={control}
        render={({ field }) => (
          <DatasetChips value={field.value ?? []} onChange={field.onChange} />
        )}
      />

      <Controller
        name="chart.interval"
        control={control}
        render={({ field }) => (
          <FloatingSelect
            label="Interval"
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            options={CHART_INTERVAL_OPTIONS}
          />
        )}
      />
    </div>
  )
}
