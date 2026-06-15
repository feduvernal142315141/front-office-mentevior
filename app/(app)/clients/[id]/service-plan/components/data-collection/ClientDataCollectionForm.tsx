"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, Minus, Plus } from "lucide-react"
import { toast } from "@/lib/compat/sonner"
import { cn } from "@/lib/utils"

import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { GroupedSelect } from "@/components/custom/GroupedSelect"
import { Button } from "@/components/custom/Button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { LevelsTable } from "@/app/(app)/my-company/service-plans/components/data-collection/LevelsTable"
import { ChartCollapsibleSection } from "@/app/(app)/my-company/service-plans/components/chart/ChartCollapsibleSection"
import { RecommendationsCollapsibleSection } from "./RecommendationsCollapsibleSection"

import {
  createClientDataCollectionFormSchema,
  formatClientDataCollectionValidationAlert,
  hasChartSectionErrors,
  hasDataCollectionSectionErrors,
  defaultRecommendations,
  type ClientDataCollectionFormValues,
} from "@/lib/schemas/client-data-collection-form.schema"
import type { RecommendationsConfig } from "@/lib/types/client-service-plan.types"

import {
  SERVICE_PLAN_UNIT_OF_TIME_OPTIONS,
  SERVICE_PLAN_VALUE_TYPE_OPTIONS,
  ServicePlanUnitOfTime,
  ServicePlanValueType,
  typeRequiresWeeklyDaily,
  typeRequiresUnitOfTime,
  typeRequiresInterval,
  typeRequiresDailyAndWeekly,
  typeHasCumulativeValueToggles,
  typeHasLevels,
  typeIsMeasurementLog,
} from "@/lib/modules/service-plans/constants/data-collection.constants"

import { useTypeEventCatalog } from "@/lib/modules/service-plans/hooks/use-type-event-catalog"
import { useUnitMeasurementCatalog } from "@/lib/modules/service-plans/hooks/use-unit-measurement-catalog"
import { useDatasetsCatalog } from "@/lib/modules/service-plans/hooks/use-datasets-catalog"

import {
  DEFAULT_CHART_CONFIG,
  pruneChartDatasetConfigs,
  type ChartConfig,
} from "@/lib/modules/service-plans/constants/chart.constants"

import type {
  DataCollectionConfig,
  DataCollectionLevel,
} from "@/lib/types/data-collection.types"

function resolveChartConfig(chart?: ChartConfig): ChartConfig {
  if (!chart) return DEFAULT_CHART_CONFIG
  const merged: ChartConfig = {
    ...DEFAULT_CHART_CONFIG,
    ...chart,
    xAxis: { ...DEFAULT_CHART_CONFIG.xAxis, ...chart.xAxis },
    yAxis: { ...DEFAULT_CHART_CONFIG.yAxis, ...chart.yAxis },
    objectives: {
      ...DEFAULT_CHART_CONFIG.objectives!,
      ...(chart.objectives ?? {}),
    },
    datasetConfigs: { ...(chart.datasetConfigs ?? {}) },
  }
  return pruneChartDatasetConfigs(merged)
}

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-red-600">{message}</p>
}

interface ClientDataCollectionFormProps {
  mode: "category" | "item"
  categoryName: string
  itemName?: string
  initialConfig?: DataCollectionConfig
  initialTopography?: string
  initialActive?: boolean
  onSave: (values: ClientDataCollectionFormValues & { recommendations: RecommendationsConfig }) => Promise<void>
  onDeleteLevel?: (level: DataCollectionLevel) => Promise<void>
  onChartLayoutChange?: (layout: { datasetCount: number; isOpen: boolean }) => void
  onCancel: () => void
  isSaving: boolean
}

export function ClientDataCollectionForm({
  mode,
  categoryName,
  itemName,
  initialConfig,
  initialTopography,
  initialActive,
  onSave,
  onDeleteLevel,
  onChartLayoutChange,
  onCancel,
  isSaving,
}: ClientDataCollectionFormProps) {
  const { groups: typeGroups, itemsMap: typeItemsMap, isLoading: isLoadingCatalog } =
    useTypeEventCatalog()
  const dataCollectionRef = useRef<HTMLDivElement>(null)
  const [recommendations, setRecommendations] = useState<RecommendationsConfig>(
    initialConfig?.recommendations ?? defaultRecommendations
  )
  const { entries: datasetCatalogEntries } = useDatasetsCatalog(true)

  const datasetNameById = useMemo(
    () => Object.fromEntries(datasetCatalogEntries.map((entry) => [entry.id, entry.name])),
    [datasetCatalogEntries]
  )

  const formSchema = useMemo(
    () =>
      createClientDataCollectionFormSchema(
        mode,
        (typeId) => {
          const item = typeItemsMap.get(typeId)
          return { name: item?.name ?? "", group: item?.group ?? "" }
        },
        (datasetId) => datasetNameById[datasetId] ?? "Dataset"
      ),
    [mode, typeItemsMap, datasetNameById]
  )

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ClientDataCollectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialConfig?.type ?? "",
      weeklyDailyValue: initialConfig?.weeklyDailyValue ?? ServicePlanValueType.TOTAL,
      dailyValue: initialConfig?.dailyValue ?? ServicePlanValueType.TOTAL,
      unitMeasurementCatalogId: initialConfig?.unitMeasurementCatalogId ?? "",
      intervalLength: initialConfig?.intervalLength ?? 30,
      unitOfTime: initialConfig?.unitOfTime ?? ServicePlanUnitOfTime.SECONDS,
      suggestedNumberOfRecordings: initialConfig?.suggestedNumberOfRecordings ?? 10,
      cumulative: initialConfig?.cumulative ?? false,
      levels: initialConfig?.levels ?? [],
      topography: initialTopography ?? "",
      active: initialActive ?? true,
      chart: resolveChartConfig(initialConfig?.chart),
    },
  })

  useEffect(() => {
    if (!initialConfig) return
    reset({
      type: initialConfig.type ?? "",
      weeklyDailyValue: initialConfig.weeklyDailyValue ?? ServicePlanValueType.TOTAL,
      dailyValue: initialConfig.dailyValue ?? ServicePlanValueType.TOTAL,
      unitMeasurementCatalogId: initialConfig.unitMeasurementCatalogId ?? "",
      intervalLength: initialConfig.intervalLength ?? 30,
      unitOfTime: initialConfig.unitOfTime ?? ServicePlanUnitOfTime.SECONDS,
      suggestedNumberOfRecordings: initialConfig.suggestedNumberOfRecordings ?? 10,
      cumulative: initialConfig.cumulative ?? false,
      levels: initialConfig.levels ?? [],
      topography: initialTopography ?? "",
      active: initialActive ?? true,
      chart: resolveChartConfig(initialConfig.chart),
    })
    setRecommendations(initialConfig.recommendations ?? defaultRecommendations)
  }, [initialConfig, initialTopography, initialActive, reset])

  const [openSection, setOpenSection] = useState<"data" | "chart" | "recommendations" | null>(
    "data"
  )
  const [chartFocusToken, setChartFocusToken] = useState(0)
  const isDataCollectionOpen = openSection === "data"
  const isChartOpen = openSection === "chart"
  const isRecommendationsOpen = openSection === "recommendations"

  const watchedType = watch("type")
  const watchedLevels = watch("levels")
  const watchedCumulative = watch("cumulative")
  const watchedIntervalLength = watch("intervalLength")
  const watchedChartDatasets = watch("chart.datasets")

  useEffect(() => {
    onChartLayoutChange?.({
      datasetCount: watchedChartDatasets?.length ?? 0,
      isOpen: isChartOpen,
    })
  }, [watchedChartDatasets, isChartOpen, onChartLayoutChange])

  const resolvedType = useMemo(() => {
    const item = typeItemsMap.get(watchedType)
    return { name: item?.name ?? "", group: item?.group ?? "" }
  }, [watchedType, typeItemsMap])

  const isMeasurementLogType = typeIsMeasurementLog(resolvedType.name)
  const { groups: unitMeasurementGroups, isLoading: isLoadingUnitMeasurement } =
    useUnitMeasurementCatalog(isMeasurementLogType)

  useEffect(() => {
    if (
      !typeRequiresWeeklyDaily(resolvedType.name) &&
      !typeRequiresDailyAndWeekly(resolvedType.name) &&
      !typeIsMeasurementLog(resolvedType.name)
    ) {
      setValue("weeklyDailyValue", undefined)
    }
    if (
      !typeRequiresDailyAndWeekly(resolvedType.name) &&
      !typeIsMeasurementLog(resolvedType.name)
    ) {
      setValue("dailyValue", undefined)
    }
    if (!typeIsMeasurementLog(resolvedType.name)) {
      setValue("unitMeasurementCatalogId", undefined)
    }
    if (!typeRequiresInterval(resolvedType.group)) {
      setValue("intervalLength", undefined)
    }
    if (
      !typeRequiresInterval(resolvedType.group) &&
      !typeRequiresDailyAndWeekly(resolvedType.name)
    ) {
      setValue("suggestedNumberOfRecordings", undefined)
    }
    if (
      !typeRequiresUnitOfTime(resolvedType.name) &&
      !typeRequiresDailyAndWeekly(resolvedType.name) &&
      !typeRequiresInterval(resolvedType.group)
    ) {
      setValue("unitOfTime", undefined)
    }
    if (!typeHasCumulativeValueToggles(resolvedType.group)) {
      setValue("cumulative", undefined)
    }
  }, [resolvedType, setValue])

  const onSubmit = handleSubmit(
    async (data) => {
      await onSave({
        ...data,
        chart: data.chart ? pruneChartDatasetConfigs(data.chart) : data.chart,
        recommendations,
      })
    },
    (formErrors) => {
      if (hasDataCollectionSectionErrors(formErrors) || formErrors.type) {
        setOpenSection("data")
        window.setTimeout(() => {
          dataCollectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
        }, 80)
      } else if (hasChartSectionErrors(formErrors)) {
        setOpenSection("chart")
        setChartFocusToken((token) => token + 1)
      }

      if (formErrors.topography) {
        window.setTimeout(() => {
          document
            .getElementById("client-dc-topography")
            ?.scrollIntoView({ block: "center", behavior: "smooth" })
        }, 80)
      }

      const datasetLabels = Object.fromEntries(
        datasetCatalogEntries.map((entry) => [entry.id, entry.name])
      )
      const alert = formatClientDataCollectionValidationAlert(formErrors, { datasetLabels })
      toast.error(alert.title, { description: alert.description })
    }
  )

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

            <div id="client-dc-topography" className="space-y-1">
              <Controller
                name="topography"
                control={control}
                render={({ field }) => (
                  <FloatingTextarea
                    label="Description"
                    required
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!errors.topography}
                    rows={3}
                  />
                )}
              />
              <FieldErrorText message={errors.topography?.message} />
            </div>

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

        {/* --- Data Collection (collapsible) --- */}
        <div ref={dataCollectionRef} className="scroll-mt-4">
          <Collapsible
            open={isDataCollectionOpen}
            onOpenChange={(next) => setOpenSection(next ? "data" : null)}
            className={cn(
              "group rounded-xl border bg-white",
              hasDataCollectionSectionErrors(errors) || errors.type
                ? "border-red-300 ring-1 ring-red-200"
                : "border-slate-200"
            )}
          >
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/20"
            >
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  Data Collection
                </h3>
                {watchedType && typeHasLevels(watchedType) && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {(watchedLevels ?? []).length} level
                    {(watchedLevels ?? []).length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
                  isDataCollectionOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-visible border-t border-slate-100">
              <div className="space-y-5 px-4 py-5">
                {/* Type */}
                <div className="space-y-1">
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <GroupedSelect
                        label="Type"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        groups={typeGroups}
                        hasError={!!errors.type}
                        searchable
                        required
                        disabled={isLoadingCatalog}
                      />
                    )}
                  />
                  <FieldErrorText message={errors.type?.message} />
                </div>

                {/* Rate → Unit of time + Weekly value */}
                {typeRequiresUnitOfTime(resolvedType.name) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Controller
                        name="unitOfTime"
                        control={control}
                        render={({ field }) => (
                          <FloatingSelect
                            label="Unit of time"
                            value={field.value ?? ServicePlanUnitOfTime.SECONDS}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={SERVICE_PLAN_UNIT_OF_TIME_OPTIONS}
                            hasError={!!errors.unitOfTime}
                          />
                        )}
                      />
                      <FieldErrorText message={errors.unitOfTime?.message} />
                    </div>
                    <div className="space-y-1">
                      <Controller
                        name="weeklyDailyValue"
                        control={control}
                        render={({ field }) => (
                          <FloatingSelect
                            label="Weekly value"
                            value={field.value ?? ServicePlanValueType.TOTAL}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={SERVICE_PLAN_VALUE_TYPE_OPTIONS}
                            hasError={!!errors.weeklyDailyValue}
                          />
                        )}
                      />
                      <FieldErrorText message={errors.weeklyDailyValue?.message} />
                    </div>
                  </div>
                )}

                {/* Frequency → only Weekly / Daily value */}
                {typeRequiresWeeklyDaily(resolvedType.name) &&
                  !typeRequiresUnitOfTime(resolvedType.name) && (
                    <div className="space-y-1">
                      <Controller
                        name="weeklyDailyValue"
                        control={control}
                        render={({ field }) => (
                          <FloatingSelect
                            label="Weekly / Daily Value"
                            value={field.value ?? ServicePlanValueType.TOTAL}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={SERVICE_PLAN_VALUE_TYPE_OPTIONS}
                            hasError={!!errors.weeklyDailyValue}
                          />
                        )}
                      />
                      <FieldErrorText message={errors.weeklyDailyValue?.message} />
                    </div>
                  )}

                {/* Measurement log */}
                {isMeasurementLogType && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Controller
                          name="unitMeasurementCatalogId"
                          control={control}
                          render={({ field }) => (
                            <GroupedSelect
                              label="Unit of Measurement"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              groups={unitMeasurementGroups}
                              hasError={!!errors.unitMeasurementCatalogId}
                              searchable
                              required
                              disabled={isLoadingUnitMeasurement}
                            />
                          )}
                        />
                        <FieldErrorText message={errors.unitMeasurementCatalogId?.message} />
                      </div>
                      <div className="space-y-1">
                        <Controller
                          name="dailyValue"
                          control={control}
                          render={({ field }) => (
                            <FloatingSelect
                              label="Daily value"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={SERVICE_PLAN_VALUE_TYPE_OPTIONS}
                              hasError={!!errors.dailyValue}
                            />
                          )}
                        />
                        <FieldErrorText message={errors.dailyValue?.message} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Controller
                        name="weeklyDailyValue"
                        control={control}
                        render={({ field }) => (
                          <FloatingSelect
                            label="Weekly value"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={SERVICE_PLAN_VALUE_TYPE_OPTIONS}
                            hasError={!!errors.weeklyDailyValue}
                          />
                        )}
                      />
                      <FieldErrorText message={errors.weeklyDailyValue?.message} />
                    </div>
                  </div>
                )}

                {/* Duration / Response latency / Interresponse time */}
                {typeRequiresDailyAndWeekly(resolvedType.name) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Controller
                          name="unitOfTime"
                          control={control}
                          render={({ field }) => (
                            <FloatingSelect
                              label="Unit of time"
                              value={field.value ?? ServicePlanUnitOfTime.SECONDS}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={SERVICE_PLAN_UNIT_OF_TIME_OPTIONS}
                              hasError={!!errors.unitOfTime}
                            />
                          )}
                        />
                        <FieldErrorText message={errors.unitOfTime?.message} />
                      </div>
                      <div className="space-y-1">
                        <Controller
                          name="suggestedNumberOfRecordings"
                          control={control}
                          render={({ field }) => (
                            <FloatingInput
                              label="Suggested number of recordings"
                              value={String(field.value ?? "")}
                              onChange={(v) =>
                                field.onChange(v === "" ? undefined : Number(v))
                              }
                              onBlur={field.onBlur}
                              type="number"
                              inputMode="numeric"
                              hasError={!!errors.suggestedNumberOfRecordings}
                            />
                          )}
                        />
                        <FieldErrorText message={errors.suggestedNumberOfRecordings?.message} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Controller
                          name="dailyValue"
                          control={control}
                          render={({ field }) => (
                            <FloatingSelect
                              label="Daily value"
                              value={field.value ?? ServicePlanValueType.TOTAL}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={SERVICE_PLAN_VALUE_TYPE_OPTIONS}
                              hasError={!!errors.dailyValue}
                            />
                          )}
                        />
                        <FieldErrorText message={errors.dailyValue?.message} />
                      </div>
                      <div className="space-y-1">
                        <Controller
                          name="weeklyDailyValue"
                          control={control}
                          render={({ field }) => (
                            <FloatingSelect
                              label="Weekly value"
                              value={field.value ?? ServicePlanValueType.TOTAL}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={SERVICE_PLAN_VALUE_TYPE_OPTIONS}
                              hasError={!!errors.weeklyDailyValue}
                            />
                          )}
                        />
                        <FieldErrorText message={errors.weeklyDailyValue?.message} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interval (time-sampling) */}
                {typeRequiresInterval(resolvedType.group) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">
                          Interval length
                        </label>
                        <div
                          className={cn(
                            "flex items-center rounded-[16px]",
                            errors.intervalLength && "ring-2 ring-red-400/60"
                          )}
                        >
                          <button
                            type="button"
                            onClick={handleIntervalDecrement}
                            className={cn(
                              "flex items-center justify-center w-10 h-[52px] 2xl:h-[56px]",
                              "border border-r-0 border-gray-200 rounded-l-[16px]",
                              "text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
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
                                className="flex-1 h-[52px] 2xl:h-[56px] text-center text-[15px] border-y border-gray-200 focus:outline-none focus:ring-0 bg-white"
                              />
                            )}
                          />
                          <button
                            type="button"
                            onClick={handleIntervalIncrement}
                            className={cn(
                              "flex items-center justify-center w-10 h-[52px] 2xl:h-[56px]",
                              "border border-l-0 border-gray-200 rounded-r-[16px]",
                              "text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                            )}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <FieldErrorText message={errors.intervalLength?.message} />
                      </div>

                      <div className="space-y-1">
                        <Controller
                          name="unitOfTime"
                          control={control}
                          render={({ field }) => (
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-slate-600 opacity-0">
                                .
                              </label>
                              <FloatingSelect
                                label="Unit of time"
                                value={field.value ?? ServicePlanUnitOfTime.SECONDS}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                options={SERVICE_PLAN_UNIT_OF_TIME_OPTIONS}
                                hasError={!!errors.unitOfTime}
                              />
                            </div>
                          )}
                        />
                        <FieldErrorText message={errors.unitOfTime?.message} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Controller
                        name="suggestedNumberOfRecordings"
                        control={control}
                        render={({ field }) => (
                          <FloatingInput
                            label="Suggested number of recordings"
                            value={String(field.value ?? "")}
                            onChange={(v) =>
                              field.onChange(v === "" ? undefined : Number(v))
                            }
                            onBlur={field.onBlur}
                            type="number"
                            inputMode="numeric"
                            hasError={!!errors.suggestedNumberOfRecordings}
                          />
                        )}
                      />
                      <FieldErrorText message={errors.suggestedNumberOfRecordings?.message} />
                    </div>
                  </div>
                )}

                {/* Levels table */}
                {typeHasLevels(watchedType) && (
                  <LevelsTable
                    levels={watchedLevels ?? []}
                    onChange={(newLevels) => setValue("levels", newLevels)}
                    onDeleteLevel={onDeleteLevel}
                    showValueToggle={typeHasCumulativeValueToggles(resolvedType.group)}
                    showCumulative={typeHasCumulativeValueToggles(resolvedType.group)}
                    cumulative={watchedCumulative ?? false}
                    onCumulativeChange={(v) => setValue("cumulative", v)}
                    levelErrors={Array.isArray(errors.levels) ? errors.levels : undefined}
                    levelsError={
                      errors.levels && !Array.isArray(errors.levels)
                        ? (errors.levels as { message?: string }).message
                        : undefined
                    }
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* --- Chart (collapsible) --- */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ChartCollapsibleSection
          control={control as any}
          setValue={setValue as any}
          getValues={getValues as any}
          open={isChartOpen}
          onOpenChange={(next) => setOpenSection(next ? "chart" : null)}
          focusToken={chartFocusToken}
        />

        {/* --- Recommendations (collapsible) --- */}
        <RecommendationsCollapsibleSection
          value={recommendations}
          onChange={setRecommendations}
          open={isRecommendationsOpen}
          onOpenChange={(next) => setOpenSection(next ? "recommendations" : null)}
        />
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
