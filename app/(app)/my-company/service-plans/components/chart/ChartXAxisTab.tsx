"use client"

import { Controller, type Control } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { AXIS_POSITION_X_OPTIONS } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"

interface ChartXAxisTabProps {
  control: Control<DataCollectionFormValues>
}

export function ChartXAxisTab({ control }: ChartXAxisTabProps) {
  return (
    <div className="flex gap-4">
      <div className="flex min-w-0 flex-[7] flex-col gap-6">
        <Controller
          name="chart.xAxis.title"
          control={control}
          render={({ field }) => (
            <FloatingInput
              label="Title"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="chart.xAxis.position"
          control={control}
          render={({ field }) => (
            <FloatingSelect
              label="Position"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={AXIS_POSITION_X_OPTIONS}
            />
          )}
        />
      </div>

      <div className="flex flex-[3] items-center justify-end">
        <Controller
          name="chart.xAxis.hideGrid"
          control={control}
          render={({ field }) => (
            <PremiumSwitch
              label="Hide grid"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              variant="success"
            />
          )}
        />
      </div>
    </div>
  )
}
