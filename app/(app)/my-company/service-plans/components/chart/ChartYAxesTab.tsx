"use client"

import { Controller, type Control } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { AXIS_POSITION_Y_OPTIONS } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"

interface ChartYAxesTabProps {
  control: Control<DataCollectionFormValues>
}

export function ChartYAxesTab({ control }: ChartYAxesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-[7] flex-col gap-6">
          <Controller
            name="chart.yAxis.title"
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
            name="chart.yAxis.position"
            control={control}
            render={({ field }) => (
              <FloatingSelect
                label="Position"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={AXIS_POSITION_Y_OPTIONS}
              />
            )}
          />
        </div>

        <div className="flex flex-[3] items-center justify-end">
          <Controller
            name="chart.yAxis.hideGrid"
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        <Controller
          name="chart.yAxis.suggestedMin"
          control={control}
          render={({ field }) => (
            <FloatingInput
              label="Suggested Min"
              value={field.value === undefined ? "" : String(field.value)}
              onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
              onBlur={field.onBlur}
              type="number"
              inputMode="numeric"
            />
          )}
        />
        <Controller
          name="chart.yAxis.suggestedMax"
          control={control}
          render={({ field }) => (
            <FloatingInput
              label="Suggested Max"
              value={field.value === undefined ? "" : String(field.value)}
              onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
              onBlur={field.onBlur}
              type="number"
              inputMode="numeric"
            />
          )}
        />
      </div>
    </div>
  )
}
