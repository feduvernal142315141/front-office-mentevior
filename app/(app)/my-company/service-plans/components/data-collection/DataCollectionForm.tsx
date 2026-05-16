"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { GroupedSelect } from "@/components/custom/GroupedSelect"
import { Button } from "@/components/custom/Button"

import { LevelsTable } from "./LevelsTable"

import {
  dataCollectionFormSchema,
  type DataCollectionFormValues,
} from "@/lib/schemas/data-collection-form.schema"

import {
  DATA_COLLECTION_TYPE_GROUPS,
  WEEKLY_DAILY_OPTIONS,
  UNIT_OF_TIME_OPTIONS,
  typeRequiresWeeklyDaily,
  typeRequiresInterval,
  typeHasCumulativeValueToggles,
  typeHasLevels,
} from "@/lib/modules/service-plans/constants/data-collection.constants"

import type { DataCollectionConfig } from "@/lib/types/data-collection.types"

interface DataCollectionFormProps {
  mode: "category" | "item"
  categoryName: string
  itemName?: string
  initialConfig?: DataCollectionConfig
  initialTopography?: string
  initialActive?: boolean
  onSave: (values: DataCollectionFormValues) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

export function DataCollectionForm({
  mode,
  categoryName,
  itemName,
  initialConfig,
  initialTopography,
  initialActive,
  onSave,
  onCancel,
  isSaving,
}: DataCollectionFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DataCollectionFormValues>({
    resolver: zodResolver(dataCollectionFormSchema),
    defaultValues: {
      type: initialConfig?.type ?? "",
      weeklyDailyValue: initialConfig?.weeklyDailyValue ?? "total",
      intervalLength: initialConfig?.intervalLength ?? 30,
      unitOfTime: initialConfig?.unitOfTime ?? "seconds",
      suggestedNumberOfRecordings: initialConfig?.suggestedNumberOfRecordings ?? 10,
      cumulative: initialConfig?.cumulative ?? false,
      levels: initialConfig?.levels ?? [],
      topography: initialTopography ?? "",
      active: initialActive ?? true,
    },
  })

  const watchedType = watch("type")
  const watchedLevels = watch("levels")
  const watchedCumulative = watch("cumulative")
  const watchedActive = watch("active")
  const watchedIntervalLength = watch("intervalLength")

  // Reset type-specific fields when type changes
  useEffect(() => {
    if (!typeRequiresWeeklyDaily(watchedType)) {
      setValue("weeklyDailyValue", undefined)
    }
    if (!typeRequiresInterval(watchedType)) {
      setValue("intervalLength", undefined)
      setValue("unitOfTime", undefined)
      setValue("suggestedNumberOfRecordings", undefined)
    }
    if (!typeHasCumulativeValueToggles(watchedType)) {
      setValue("cumulative", undefined)
    }
  }, [watchedType, setValue])

  const onSubmit = handleSubmit(async (data) => {
    await onSave(data)
  })

  const handleIntervalIncrement = () => {
    const current = watchedIntervalLength ?? 30
    setValue("intervalLength", current + 1)
  }

  const handleIntervalDecrement = () => {
    const current = watchedIntervalLength ?? 30
    if (current > 1) setValue("intervalLength", current - 1)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* --- Header section --- */}
        {mode === "item" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label="Name"
                value={itemName ?? ""}
                onChange={() => {}}
                onBlur={() => {}}
                disabled
              />
              <FloatingInput
                label="Category"
                value={categoryName}
                onChange={() => {}}
                onBlur={() => {}}
                disabled
              />
            </div>

            <Controller
              name="topography"
              control={control}
              render={({ field }) => (
                <FloatingTextarea
                  label="Topography"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!errors.topography}
                  rows={3}
                />
              )}
            />

            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <PremiumSwitch
                  label="Status"
                  description={field.value ? "Active" : "Inactive"}
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                  variant="success"
                />
              )}
            />

            <div className="border-t border-gray-100" />
          </div>
        )}

        {mode === "category" && (
          <div className="space-y-4">
            <FloatingInput
              label="Category"
              value={categoryName}
              onChange={() => {}}
              onBlur={() => {}}
              disabled
            />
            <div className="border-t border-gray-100" />
          </div>
        )}

        {/* --- Data Collection section --- */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Data Collection
          </h3>

          {/* Type (grouped select) */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <GroupedSelect
                label="Type"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                groups={DATA_COLLECTION_TYPE_GROUPS as unknown as { group: string; options: { value: string; label: string }[] }[]}
                hasError={!!errors.type}
                searchable
                required
              />
            )}
          />

          {/* Weekly/Daily Value — only for frequency */}
          {typeRequiresWeeklyDaily(watchedType) && (
            <Controller
              name="weeklyDailyValue"
              control={control}
              render={({ field }) => (
                <FloatingSelect
                  label="Weekly / Daily Value"
                  value={field.value ?? "total"}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={WEEKLY_DAILY_OPTIONS}
                />
              )}
            />
          )}

          {/* Interval fields — for time-sampling types */}
          {typeRequiresInterval(watchedType) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Interval length with +/- stepper */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600">Interval length</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleIntervalDecrement}
                      className={cn(
                        "flex items-center justify-center w-10 h-[52px] 2xl:h-[56px]",
                        "border border-r-0 border-gray-200 rounded-l-[16px]",
                        "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                        "transition-colors"
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <Controller
                      name="intervalLength"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          value={field.value ?? 30}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          className={cn(
                            "flex-1 h-[52px] 2xl:h-[56px] text-center text-[15px]",
                            "border-y border-gray-200",
                            "focus:outline-none focus:ring-0",
                            "bg-white"
                          )}
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={handleIntervalIncrement}
                      className={cn(
                        "flex items-center justify-center w-10 h-[52px] 2xl:h-[56px]",
                        "border border-l-0 border-gray-200 rounded-r-[16px]",
                        "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                        "transition-colors"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Unit of time */}
                <Controller
                  name="unitOfTime"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 opacity-0">.</label>
                      <FloatingSelect
                        label="Unit of time"
                        value={field.value ?? "seconds"}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={UNIT_OF_TIME_OPTIONS}
                      />
                    </div>
                  )}
                />
              </div>

              {/* Suggested number of recordings */}
              <Controller
                name="suggestedNumberOfRecordings"
                control={control}
                render={({ field }) => (
                  <FloatingInput
                    label="Suggested number of recordings"
                    value={String(field.value ?? "")}
                    onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
                    onBlur={field.onBlur}
                    type="number"
                    inputMode="numeric"
                    hasError={!!errors.suggestedNumberOfRecordings}
                  />
                )}
              />
            </div>
          )}

          {/* Levels table — shown when a type is selected */}
          {typeHasLevels(watchedType) && (
            <LevelsTable
              levels={watchedLevels ?? []}
              onChange={(newLevels) => setValue("levels", newLevels)}
              showValueToggle={typeHasCumulativeValueToggles(watchedType)}
              showCumulative={typeHasCumulativeValueToggles(watchedType)}
              cumulative={watchedCumulative ?? false}
              onCumulativeChange={(v) => setValue("cumulative", v)}
            />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
