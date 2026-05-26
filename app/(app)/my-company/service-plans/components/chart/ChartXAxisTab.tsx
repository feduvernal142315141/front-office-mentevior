"use client"

import { Controller, useFormState, type Control } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { AXIS_POSITION_X_OPTIONS } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"
import { ChartFieldError } from "./ChartFieldError"

interface ChartXAxisTabProps {
  control: Control<DataCollectionFormValues>
}

export function ChartXAxisTab({ control }: ChartXAxisTabProps) {
  const { errors } = useFormState({ control })
  const xAxisErrors = (errors.chart as { xAxis?: Record<string, { message?: string }> } | undefined)?.xAxis

  return (
    <div className="flex gap-4">
      <div className="flex min-w-0 flex-[7] flex-col gap-6">
        <div className="space-y-1">
          <Controller
            name="chart.xAxis.title"
            control={control}
            render={({ field }) => (
              <FloatingInput
                label="Title"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!xAxisErrors?.title}
              />
            )}
          />
          <ChartFieldError message={xAxisErrors?.title?.message} />
        </div>
        <div className="space-y-1">
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
                hasError={!!xAxisErrors?.position}
              />
            )}
          />
          <ChartFieldError message={xAxisErrors?.position?.message} />
        </div>
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
