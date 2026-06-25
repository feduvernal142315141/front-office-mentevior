"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Database,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Target,
  Loader2,
  Minus,
  Plus,
} from "lucide-react"
import { toast } from "@/lib/compat/sonner"
import { cn } from "@/lib/utils"

import { CustomModal } from "@/components/custom/CustomModal"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { GroupedSelect } from "@/components/custom/GroupedSelect"
import { Button } from "@/components/custom/Button"

import { LevelsTable } from "@/app/(app)/my-company/service-plans/components/data-collection/LevelsTable"
import { ChartCollapsibleSection } from "@/app/(app)/my-company/service-plans/components/chart/ChartCollapsibleSection"
import {
  RecommendationsCollapsibleSection,
  validateRecommendations,
  type RecommendationErrors,
} from "../../service-plan/components/data-collection/RecommendationsCollapsibleSection"
import { useStrategyCatalog } from "@/lib/modules/client-service-plan/hooks/use-strategy-catalog"
import { usePeriodCatalog } from "@/lib/modules/client-service-plan/hooks/use-period-catalog"
import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import {
  BaselinesTabContent,
  createEmptyBaseline,
  type BaselineRow,
} from "./BaselinesTabContent"
import { ObjectivesTabContent } from "./ObjectivesTabContent"
import type { ObjectiveRow } from "./ObjectiveFormModal"

import {
  deleteClientCategoryLevel,
  deleteClientItemLevel,
  getClientCategoryDataCollection,
  getClientItemDataCollection,
  upsertClientCategoryDataCollection,
  upsertClientItemDataCollection,
} from "@/lib/modules/client-service-plan/services/client-data-collection.service"

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
  ItemDataCollectionConfig,
  DataCollectionType,
} from "@/lib/types/data-collection.types"

// ---------------------------------------------------------------------------

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

function stripPersistedLevelIds(config: DataCollectionConfig): DataCollectionConfig {
  return {
    ...config,
    levels: config.levels.map(({ recordId: _recordId, ...level }) => level),
  }
}

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-red-600">{message}</p>
}

// ---------------------------------------------------------------------------

/** ISO → YYYY-MM-DD for date pickers */
function fromISO(d: string): string {
  if (!d) return ""
  return d.includes("T") ? d.split("T")[0] : d
}

/** YYYY-MM-DD → ISO for API payloads */
function toISO(d: string): string {
  if (!d) return ""
  return d.includes("T") ? d : `${d}T00:00:00.000Z`
}

interface ClientDataCollectionModalProps {
  open: boolean
  onClose: () => void
  mode: "category" | "item"
  categoryId: string
  categoryName: string
  clientServicePlanCategoryItemId?: string
  itemName?: string
  onSaved: () => void
}

export function ClientDataCollectionModal({
  open,
  onClose,
  mode,
  categoryId,
  categoryName,
  clientServicePlanCategoryItemId,
  itemName,
  onSaved,
}: ClientDataCollectionModalProps) {
  const params = useParams()
  const clientId = typeof params?.id === "string" ? params.id : null
  const { client } = useClientById(clientId)
  const clientFirstName = client?.firstName?.trim() || undefined
  const targetName = mode === "item" ? itemName : categoryName

  // --- Load / save state ---
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<DataCollectionConfig | null>(null)
  const [itemConfig, setItemConfig] = useState<ItemDataCollectionConfig | null>(null)
  const [activeTab, setActiveTab] = useState("data-collection")
  const [recommendations, setRecommendations] = useState<RecommendationsConfig>(defaultRecommendations)
  const [recommendationErrors, setRecommendationErrors] = useState<RecommendationErrors>({})
  const [baselinesError, setBaselinesError] = useState(false)
  const [objectivesError, setObjectivesError] = useState(false)
  const [baselines, setBaselines] = useState<BaselineRow[]>([])
  const [objectives, setObjectives] = useState<ObjectiveRow[]>([])

  // --- Catalogs (loaded once when modal opens) ---
  const { items: periodCatalog, isLoading: isLoadingPeriods } = usePeriodCatalog()
  const periodSelectOptions = useMemo(
    () => periodCatalog.map((p) => ({ value: p.id, label: p.name })),
    [periodCatalog]
  )
  const periodMap = useMemo(
    () => new Map(periodCatalog.map((p) => [p.id, p.name])),
    [periodCatalog]
  )
  const { groups: typeGroups, itemsMap: typeItemsMap, isLoading: isLoadingCatalog } =
    useTypeEventCatalog()
  const { entries: datasetCatalogEntries } = useDatasetsCatalog(true)
  const { items: strategyCatalogItems } = useStrategyCatalog()

  const datasetNameById = useMemo(
    () => Object.fromEntries(datasetCatalogEntries.map((e) => [e.id, e.name])),
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

  // --- Form ---
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
      type: "",
      weeklyDailyValue: ServicePlanValueType.TOTAL,
      dailyValue: ServicePlanValueType.TOTAL,
      unitMeasurementCatalogId: "",
      intervalLength: 30,
      unitOfTime: ServicePlanUnitOfTime.SECONDS,
      suggestedNumberOfRecordings: 10,
      cumulative: false,
      levels: [],
      topography: "",
      active: true,
      chart: DEFAULT_CHART_CONFIG,
    },
  })

  // --- Load config ---
  const loadConfig = useCallback(async () => {
    if (!open) return
    setIsLoading(true)
    try {
      if (mode === "category") {
        const data = await getClientCategoryDataCollection(categoryId)
        setConfig(data)
        setItemConfig(null)
        setBaselines(
          (data?.baselines ?? []).map((b) => ({
            localId: crypto.randomUUID(),
            recordId: b.recordId,
            date: fromISO(b.date),
            value: String(b.value),
            periodCatalogId: b.periodCatalogId,
            comments: b.environmentalChanges ?? b.comments ?? "",
            show: b.show,
          }))
        )
        setObjectives(
          (data?.objectives ?? []).map((o) => ({
            localId: crypto.randomUUID(),
            recordId: o.recordId,
            name: o.name,
            startDate: fromISO(o.startDate),
            estimatedEndDate: fromISO(o.estimatedEndDate),
            endDate: fromISO(o.endDate),
            operatorSmartCriteria: o.operatorSmartCriteria,
            valueSmartCriteria: String(o.valueSmartCriteria),
            periodSmartCriteriaCatalogId: o.periodSmartCriteriaCatalogId,
            valueDuration: String(o.valueDuration),
            periodDurationCatalogId: o.periodDurationCatalogId,
          }))
        )
      } else if (mode === "item" && clientServicePlanCategoryItemId) {
        const itemData = await getClientItemDataCollection(clientServicePlanCategoryItemId)
        if (itemData) {
          setItemConfig(itemData)
          setConfig(itemData)
          setBaselines(
            (itemData.baselines ?? []).map((b) => ({
              localId: crypto.randomUUID(),
              recordId: b.recordId,
              date: fromISO(b.date),
              value: String(b.value),
              periodCatalogId: b.periodCatalogId,
              comments: b.environmentalChanges ?? b.comments ?? "",
              show: b.show,
            }))
          )
          setObjectives(
            (itemData.objectives ?? []).map((o) => ({
              localId: crypto.randomUUID(),
              recordId: o.recordId,
              name: o.name,
              startDate: fromISO(o.startDate),
              estimatedEndDate: fromISO(o.estimatedEndDate),
              endDate: fromISO(o.endDate),
              operatorSmartCriteria: o.operatorSmartCriteria,
              valueSmartCriteria: String(o.valueSmartCriteria),
              periodSmartCriteriaCatalogId: o.periodSmartCriteriaCatalogId,
              valueDuration: String(o.valueDuration),
              periodDurationCatalogId: o.periodDurationCatalogId,
            }))
          )
        } else {
          const catData = await getClientCategoryDataCollection(categoryId)
          setConfig(catData ? stripPersistedLevelIds(catData) : null)
          setItemConfig(null)
          setBaselines([])
          setObjectives([])
        }
      }
    } catch {
      toast.error("Unable to load configuration", {
        description: "Failed to load data collection configuration.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [open, mode, categoryId, clientServicePlanCategoryItemId])

  useEffect(() => {
    if (open) {
      setActiveTab("data-collection")
      loadConfig()
    } else {
      setConfig(null)
      setItemConfig(null)
      setRecommendations(defaultRecommendations)
      setRecommendationErrors({})
      setBaselinesError(false)
      setObjectivesError(false)
      setBaselines([])
      setObjectives([])
      reset({
        type: "",
        weeklyDailyValue: ServicePlanValueType.TOTAL,
        dailyValue: ServicePlanValueType.TOTAL,
        unitMeasurementCatalogId: "",
        intervalLength: 30,
        unitOfTime: ServicePlanUnitOfTime.SECONDS,
        suggestedNumberOfRecordings: 10,
        cumulative: false,
        levels: [],
        topography: "",
        active: true,
        chart: DEFAULT_CHART_CONFIG,
      })
    }
  }, [open, loadConfig])

  // Sync form when config loads
  useEffect(() => {
    if (!config) return
    reset({
      type: config.type ?? "",
      weeklyDailyValue: config.weeklyDailyValue ?? ServicePlanValueType.TOTAL,
      dailyValue: config.dailyValue ?? ServicePlanValueType.TOTAL,
      unitMeasurementCatalogId: config.unitMeasurementCatalogId ?? "",
      intervalLength: config.intervalLength ?? 30,
      unitOfTime: config.unitOfTime ?? ServicePlanUnitOfTime.SECONDS,
      suggestedNumberOfRecordings: config.suggestedNumberOfRecordings ?? 10,
      cumulative: config.cumulative ?? false,
      levels: config.levels ?? [],
      topography: itemConfig?.topography ?? "",
      active: itemConfig?.active ?? true,
      chart: resolveChartConfig(config.chart),
    })
    setRecommendations(config.recommendations ?? defaultRecommendations)
  }, [config, itemConfig, reset])

  // --- Watched values ---
  const watchedType = watch("type")
  const watchedLevels = watch("levels")
  const watchedCumulative = watch("cumulative")
  const watchedIntervalLength = watch("intervalLength")

  const resolvedType = useMemo(() => {
    const item = typeItemsMap.get(watchedType)
    return { name: item?.name ?? "", group: item?.group ?? "" }
  }, [watchedType, typeItemsMap])

  const isMeasurementLogType = typeIsMeasurementLog(resolvedType.name)
  const { groups: unitMeasurementGroups, isLoading: isLoadingUnitMeasurement } =
    useUnitMeasurementCatalog(isMeasurementLogType)

  // Reset fields when type changes
  useEffect(() => {
    if (!typeRequiresWeeklyDaily(resolvedType.name) && !typeRequiresDailyAndWeekly(resolvedType.name) && !typeIsMeasurementLog(resolvedType.name)) {
      setValue("weeklyDailyValue", undefined)
    }
    if (!typeRequiresDailyAndWeekly(resolvedType.name) && !typeIsMeasurementLog(resolvedType.name)) {
      setValue("dailyValue", undefined)
    }
    if (!typeIsMeasurementLog(resolvedType.name)) {
      setValue("unitMeasurementCatalogId", undefined)
    }
    if (!typeRequiresInterval(resolvedType.group)) {
      setValue("intervalLength", undefined)
    }
    if (!typeRequiresInterval(resolvedType.group) && !typeRequiresDailyAndWeekly(resolvedType.name)) {
      setValue("suggestedNumberOfRecordings", undefined)
    }
    if (!typeRequiresUnitOfTime(resolvedType.name) && !typeRequiresDailyAndWeekly(resolvedType.name) && !typeRequiresInterval(resolvedType.group)) {
      setValue("unitOfTime", undefined)
    }
    if (!typeHasCumulativeValueToggles(resolvedType.group)) {
      setValue("cumulative", undefined)
    }
  }, [resolvedType, setValue])

  // --- Delete level ---
  const handleDeleteLevel = async (level: DataCollectionLevel) => {
    if (!level.recordId) return
    try {
      if (mode === "item") {
        await deleteClientItemLevel(level.recordId)
      } else {
        await deleteClientCategoryLevel(level.recordId)
      }
      toast.success("Level removed")
    } catch {
      toast.error("Unable to delete level")
      throw new Error("Failed to delete level")
    }
  }

  // Clear recommendation errors when user changes selections
  const handleRecommendationsChange = (rec: RecommendationsConfig) => {
    setRecommendations(rec)
    if (Object.keys(recommendationErrors).length > 0) {
      setRecommendationErrors({})
    }
  }

  // Clear baselines error when user changes baselines
  const handleBaselinesChange = (rows: BaselineRow[]) => {
    setBaselines(rows)
    if (baselinesError) setBaselinesError(false)
  }

  // Clear objectives error when user changes objectives
  const handleObjectivesChange = (rows: ObjectiveRow[]) => {
    setObjectives(rows)
    if (objectivesError) setObjectivesError(false)
  }

  // --- Save ---
  const handleSave = async (values: ClientDataCollectionFormValues) => {
    // Validate client-side before API call
    let hasErrors = false

    if (hasErrors) {
      toast.error("Complete required fields", {
        description: "Please fill in all required fields before saving.",
      })
      return
    }

    setIsSaving(true)
    try {
      const levelsPayload = (values.levels ?? []).map((l) => ({
        ...(l.recordId ? { id: l.recordId } : {}),
        label: l.label,
        description: l.description,
        value: l.value,
      }))

      const baselinesPayload = baselines
        .filter((b) => b.date && b.periodCatalogId)
        .map((b) => ({
          recordId: b.recordId,
          date: toISO(b.date),
          value: Number(b.value) || 0,
          periodCatalogId: b.periodCatalogId,
          environmentalChanges: b.comments,
          show: b.show,
        }))

      const objectivesPayload = objectives
        .filter((o) => o.name.trim())
        .map((o) => ({
          recordId: o.recordId,
          name: o.name,
          startDate: toISO(o.startDate),
          estimatedEndDate: toISO(o.estimatedEndDate),
          endDate: toISO(o.endDate),
          operatorSmartCriteria: o.operatorSmartCriteria,
          valueSmartCriteria: Number(o.valueSmartCriteria) || 0,
          periodSmartCriteriaCatalogId: o.periodSmartCriteriaCatalogId,
          valueDuration: Number(o.valueDuration) || 0,
          periodDurationCatalogId: o.periodDurationCatalogId,
        }))

      if (mode === "category") {
        await upsertClientCategoryDataCollection({
          clientServicePlanCategoryId: categoryId,
          type: values.type as DataCollectionType,
          weeklyDailyValue: values.weeklyDailyValue,
          dailyValue: values.dailyValue,
          unitMeasurementCatalogId: values.unitMeasurementCatalogId,
          levels: levelsPayload,
          intervalLength: values.intervalLength,
          unitOfTime: values.unitOfTime,
          suggestedNumberOfRecordings: values.suggestedNumberOfRecordings,
          cumulative: values.cumulative,
          chart: values.chart,
          baselines: baselinesPayload,
          objectives: objectivesPayload,
          recommendations,
        })
        toast.success(`Configuration applied to all items in "${categoryName}"`)
      } else if (mode === "item" && clientServicePlanCategoryItemId) {
        await upsertClientItemDataCollection({
          clientServicePlanCategoryItemId,
          name: itemName,
          type: values.type as DataCollectionType,
          weeklyDailyValue: values.weeklyDailyValue,
          dailyValue: values.dailyValue,
          unitMeasurementCatalogId: values.unitMeasurementCatalogId,
          levels: levelsPayload,
          intervalLength: values.intervalLength,
          unitOfTime: values.unitOfTime,
          suggestedNumberOfRecordings: values.suggestedNumberOfRecordings,
          cumulative: values.cumulative,
          topography: values.topography ?? "",
          active: values.active ?? true,
          chart: values.chart,
          baselines: baselinesPayload,
          objectives: objectivesPayload,
          recommendations,
        })
        toast.success("Item configuration saved")
      }

      onSaved()
      onClose()
    } catch {
      // API errors surfaced by global interceptor
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmit = handleSubmit(
    async (data) => {
      await handleSave({
        ...data,
        chart: data.chart ? pruneChartDatasetConfigs(data.chart) : data.chart,
      })
    },
    (formErrors) => {
      if (hasDataCollectionSectionErrors(formErrors) || formErrors.type) {
        setActiveTab("data-collection")
      } else if (hasChartSectionErrors(formErrors)) {
        setActiveTab("chart")
      }

      const datasetLabels = Object.fromEntries(
        datasetCatalogEntries.map((e) => [e.id, e.name])
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

  const handleClose = () => {
    if (isSaving) return
    onClose()
  }

  // --- Modal title ---
  const modalTitle =
    mode === "category"
      ? `Data Collection — ${categoryName}`
      : `Data Collection — ${itemName ?? "Item"}`

  // --- Tab content: Data Collection ---
  const dataCollectionContent = (
    <div className="space-y-5 pt-2">
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

      {/* Frequency → Weekly / Daily value */}
      {typeRequiresWeeklyDaily(resolvedType.name) && !typeRequiresUnitOfTime(resolvedType.name) && (
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
                    onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
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
              <label className="text-sm font-medium text-slate-600">Interval length</label>
              <div className={cn("flex items-center rounded-[16px]", errors.intervalLength && "ring-2 ring-red-400/60")}>
                <button
                  type="button"
                  onClick={handleIntervalDecrement}
                  className="flex items-center justify-center w-10 h-[52px] 2xl:h-[56px] border border-r-0 border-gray-200 rounded-l-[16px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
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
                  className="flex items-center justify-center w-10 h-[52px] 2xl:h-[56px] border border-l-0 border-gray-200 rounded-r-[16px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
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
                    <label className="text-sm font-medium text-slate-600 opacity-0">.</label>
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
                  onChange={(v) => field.onChange(v === "" ? undefined : Number(v))}
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

    </div>
  )

  // --- Tab content: Chart ---
  const chartContent = (
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    <ChartCollapsibleSection
      control={control as any}
      setValue={setValue as any}
      getValues={getValues as any}
      open={true}
      onOpenChange={() => {}}
    />
  )

  // --- Tabs ---
  const tabItems: TabItem[] = useMemo(
    () => [
      {
        id: "data-collection",
        label: "Data Collection",
        icon: <Database className="w-4 h-4" />,
        content: (
          <div className="h-full min-h-0 overflow-y-auto custom-scrollbar pr-1">
            {dataCollectionContent}
          </div>
        ),
      },
      ...(mode === "item" ? [
        {
          id: "recommendations",
          label: "Recommendations",
          icon: <Lightbulb className="w-4 h-4" />,
          content: (
            <div className="h-full min-h-0 overflow-y-auto custom-scrollbar pr-1">
              <RecommendationsCollapsibleSection
                value={recommendations}
                onChange={handleRecommendationsChange}
                errors={{}}
                open={true}
                onOpenChange={() => {}}
              />
            </div>
          ),
        },
        {
          id: "baselines",
          label: "Baselines",
          icon: <TrendingUp className="w-4 h-4" />,
          badge: baselines.length || undefined,
          hasError: baselinesError,
          content: (
            <div className="h-full min-h-0 overflow-y-auto custom-scrollbar pr-1">
              <BaselinesTabContent
                baselines={baselines}
                onChange={handleBaselinesChange}
                mode={mode}
                periodSelectOptions={periodSelectOptions}
                showErrors={baselinesError}
              />
            </div>
          ),
        },
        {
          id: "objectives",
          label: "Objectives",
          icon: <Target className="w-4 h-4" />,
          badge: objectives.length || undefined,
          hasError: objectivesError,
          content: (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ObjectivesTabContent
                objectives={objectives}
                onChange={handleObjectivesChange}
                mode={mode}
                periodMap={periodMap}
                periodSelectOptions={periodSelectOptions}
                clientFirstName={clientFirstName}
                targetName={targetName}
                dataCollectionTypeName={resolvedType.name}
              />
            </div>
          ),
        },
      ] as TabItem[] : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      watchedType,
      watchedLevels,
      watchedCumulative,
      watchedIntervalLength,
      resolvedType,
      errors,
      typeGroups,
      isLoadingCatalog,
      unitMeasurementGroups,
      isLoadingUnitMeasurement,
      isMeasurementLogType,
      control,
      setValue,
      getValues,
      baselines,
      objectives,
      recommendations,
      recommendationErrors,
      baselinesError,
      objectivesError,
      periodMap,
      periodSelectOptions,
      clientFirstName,
      targetName,
      mode,
    ]
  )

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
      title={modalTitle}
      maxWidthClassName="sm:max-w-[960px]"
      allowSelectOverflow
      constrainHeight
      contentClassName="!border-0 !bg-transparent"
      onPointerDownOutside={(e) => {
        if (isSaving) e.preventDefault()
      }}
      onEscapeKeyDown={(e) => {
        if (isSaving) e.preventDefault()
      }}
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#037ECC]" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Item header fields */}
          {mode === "item" && (
            <div className="shrink-0 space-y-3 px-6 pt-3 pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FloatingInput label="Name" value={itemName ?? ""} onChange={() => {}} onBlur={() => {}} disabled />
                <FloatingInput label="Category" value={categoryName} onChange={() => {}} onBlur={() => {}} disabled />
              </div>
              <div className="space-y-1">
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
                      rows={2}
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
            </div>
          )}

          {mode === "category" && (
            <div className="shrink-0 px-6 pt-3 pb-2">
              <FloatingInput label="Category" value={categoryName} onChange={() => {}} onBlur={() => {}} disabled />
            </div>
          )}

          {/* Tabs */}
          <Tabs
            items={tabItems}
            activeTab={activeTab}
            onChange={setActiveTab}
            fillHeight
            className="min-h-0 flex-1"
          />

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      )}
    </CustomModal>
  )
}
