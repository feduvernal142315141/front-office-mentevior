"use client"

import { Controller, type Control } from "react-hook-form"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingColorPicker } from "@/components/custom/FloatingColorPicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { OBJECTIVES_LINE_TYPE_OPTIONS } from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"

interface ChartObjectivesTabProps {
  control: Control<DataCollectionFormValues>
}

export function ChartObjectivesTab({ control }: ChartObjectivesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 items-end">
        <Controller
          name="chart.objectives.showLabel"
          control={control}
          render={({ field }) => (
            <PremiumSwitch
              label="Show Label"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              variant="success"
            />
          )}
        />
        <Controller
          name="chart.objectives.fontColor"
          control={control}
          render={({ field }) => (
            <FloatingColorPicker
              label="Font Color"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <div />

        <Controller
          name="chart.objectives.showLine"
          control={control}
          render={({ field }) => (
            <PremiumSwitch
              label="Show Line"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              variant="success"
            />
          )}
        />
        <Controller
          name="chart.objectives.borderColor"
          control={control}
          render={({ field }) => (
            <FloatingColorPicker
              label="Border Color"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="chart.objectives.lineType"
          control={control}
          render={({ field }) => (
            <FloatingSelect
              label="Line Type"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={OBJECTIVES_LINE_TYPE_OPTIONS}
            />
          )}
        />

        <Controller
          name="chart.objectives.showBackground"
          control={control}
          render={({ field }) => (
            <PremiumSwitch
              label="Show Background"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              variant="success"
            />
          )}
        />
        <Controller
          name="chart.objectives.backgroundColor"
          control={control}
          render={({ field }) => (
            <FloatingColorPicker
              label="Background Color"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <div />
      </div>
    </div>
  )
}
