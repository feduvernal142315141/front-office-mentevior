"use client"

import { Controller, useFieldArray, type Control } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { Button } from "@/components/custom/Button"
import {
  AXIS_POSITION_Y_OPTIONS,
  AxisPositionY,
} from "@/lib/modules/service-plans/constants/chart.constants"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"

interface ChartYAxesTabProps {
  control: Control<DataCollectionFormValues>
}

export function ChartYAxesTab({ control }: ChartYAxesTabProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "chart.yAxes",
  })

  const handleAdd = () => {
    append({
      id: `y-axis-${Date.now()}`,
      title: "",
      position: AxisPositionY.LEFT,
      hideGrid: false,
      suggestedMin: 0,
      suggestedMax: 20,
    })
  }

  return (
    <div className="space-y-6">
      {fields.map((axis, index) => (
        <div
          key={axis.id}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4"
        >
          {fields.length > 1 && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => remove(index)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/90 text-white shadow-sm transition-colors hover:bg-red-500"
                aria-label="Delete Y axis"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex min-w-0 flex-[7] flex-col gap-6">
                <Controller
                  name={`chart.yAxes.${index}.title`}
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
                  name={`chart.yAxes.${index}.position`}
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
                  name={`chart.yAxes.${index}.hideGrid`}
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
                name={`chart.yAxes.${index}.suggestedMin`}
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
                name={`chart.yAxes.${index}.suggestedMax`}
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
        </div>
      ))}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="primary"
          onClick={handleAdd}
          className="h-10 rounded-xl bg-green-500 px-4 hover:bg-green-600"
        >
          <Plus className="h-4 w-4" />
          Add Y axis
        </Button>
      </div>
    </div>
  )
}
