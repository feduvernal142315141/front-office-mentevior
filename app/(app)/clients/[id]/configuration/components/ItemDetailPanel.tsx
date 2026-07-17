"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Save,
} from "lucide-react"
import { toast } from "@/lib/compat/sonner"
import { cn } from "@/lib/utils"

import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { GroupedSelect } from "@/components/custom/GroupedSelect"
import { Button } from "@/components/custom/Button"

import { useAlert } from "@/lib/contexts/alert-context"
import { usePeriodCatalog } from "@/lib/modules/client-service-plan/hooks/use-period-catalog"
import { useTeachingMethodCatalog } from "@/lib/modules/client-service-plan/hooks/use-teaching-method-catalog"
import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import {
  BaselinesTabContent,
  createEmptyBaseline,
  type BaselineRow,
} from "./BaselinesTabContent"
import { ObjectivesTabContent } from "./ObjectivesTabContent"
import type { ObjectiveRow } from "./ObjectiveFormModal"

import {
  deleteClientItemLevel,
  getClientCategoryDataCollection,
  getClientItemDataCollection,
  upsertClientItemDataCollection,
} from "@/lib/modules/client-service-plan/services/client-data-collection.service"

import {
  createClientDataCollectionFormSchema,
  formatClientDataCollectionValidationAlert,
  type ClientDataCollectionFormValues,
} from "@/lib/schemas/client-data-collection-form.schema"

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
// Helpers (shared with modal)
// ---------------------------------------------------------------------------

function resolveChartConfig(chart?: ChartConfig): ChartConfig {
  if (!chart) return DEFAULT_CHART_CONFIG
  return pruneChartDatasetConfigs({
    ...DEFAULT_CHART_CONFIG,
    ...chart,
    xAxis: { ...DEFAULT_CHART_CONFIG.xAxis, ...chart.xAxis },
    yAxis: { ...DEFAULT_CHART_CONFIG.yAxis, ...chart.yAxis },
    objectives: { ...DEFAULT_CHART_CONFIG.objectives!, ...(chart.objectives ?? {}) },
    datasetConfigs: { ...(chart.datasetConfigs ?? {}) },
  })
}

function stripPersistedLevelIds(config: DataCollectionConfig): DataCollectionConfig {
  return { ...config, levels: config.levels.map(({ recordId: _r, ...l }) => l) }
}

/** Build form defaults with type-conditional fields already cleaned (matches UI). */
function buildItemFormValues(
  config: DataCollectionConfig,
  itemConfig: ItemDataCollectionConfig | null,
  typeName: string,
  typeGroup: string,
): ClientDataCollectionFormValues {
  const values: ClientDataCollectionFormValues = {
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
  }

  if (
    !typeRequiresWeeklyDaily(typeName) &&
    !typeRequiresDailyAndWeekly(typeName) &&
    !typeIsMeasurementLog(typeName)
  ) {
    values.weeklyDailyValue = undefined
  }
  if (!typeRequiresDailyAndWeekly(typeName) && !typeIsMeasurementLog(typeName)) {
    values.dailyValue = undefined
  }
  if (!typeIsMeasurementLog(typeName)) {
    values.unitMeasurementCatalogId = undefined
  }
  if (!typeRequiresInterval(typeGroup)) {
    values.intervalLength = undefined
  }
  if (!typeRequiresInterval(typeGroup) && !typeRequiresDailyAndWeekly(typeName)) {
    values.suggestedNumberOfRecordings = undefined
  }
  if (
    !typeRequiresUnitOfTime(typeName) &&
    !typeRequiresDailyAndWeekly(typeName) &&
    !typeRequiresInterval(typeGroup)
  ) {
    values.unitOfTime = undefined
  }
  if (!typeHasCumulativeValueToggles(typeGroup)) {
    values.cumulative = undefined
  }

  return values
}

function snapshotRows<T extends { localId: string }>(rows: T[]): string {
  return JSON.stringify(rows.map(({ localId: _id, ...rest }) => rest))
}

function fromISO(d: string): string {
  if (!d) return ""
  return d.includes("T") ? d.split("T")[0] : d
}

function toISO(d: string): string {
  if (!d) return ""
  return d.includes("T") ? d : `${d}T00:00:00.000Z`
}

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-red-600">{message}</p>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ItemDetailPanelProps {
  categoryId: string
  categoryName: string
  clientServicePlanCategoryItemId: string
  itemName: string
  onBack: () => void
  onSaved: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function ItemDetailPanel({
  categoryId,
  categoryName,
  clientServicePlanCategoryItemId,
  itemName,
  onBack,
  onSaved,
  onDirtyChange,
}: ItemDetailPanelProps) {
  const params = useParams()
  const clientId = typeof params?.id === "string" ? params.id : null
  const { client } = useClientById(clientId)
  const clientFirstName = client?.firstName?.trim() || undefined

  // --- State ---
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<DataCollectionConfig | null>(null)
  const [itemConfig, setItemConfig] = useState<ItemDataCollectionConfig | null>(null)
  const [baselines, setBaselines] = useState<BaselineRow[]>([])
  const [objectives, setObjectives] = useState<ObjectiveRow[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [teachingMethod, setTeachingMethod] = useState("")

  // --- Catalogs ---
  const { selectOptions: teachingMethodOptions, isLoading: isLoadingTeachingMethods } = useTeachingMethodCatalog()
  const { items: periodCatalog } = usePeriodCatalog()
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
  const datasetNameById = useMemo(
    () => Object.fromEntries(datasetCatalogEntries.map((e) => [e.id, e.name])),
    [datasetCatalogEntries]
  )

  const formSchema = useMemo(
    () =>
      createClientDataCollectionFormSchema(
        "item",
        (typeId) => {
          const item = typeItemsMap.get(typeId)
          return { name: item?.name ?? "", group: item?.group ?? "" }
        },
        (datasetId) => datasetNameById[datasetId] ?? "Dataset"
      ),
    [typeItemsMap, datasetNameById]
  )

  // --- Form ---
  const alert = useAlert()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isDirty: isFormDirty },
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
    setIsLoading(true)
    setInitialized(false)
    try {
      const itemData = await getClientItemDataCollection(clientServicePlanCategoryItemId)
      if (itemData) {
        setItemConfig(itemData)
        setConfig(itemData)
        setTeachingMethod(itemData.teachingMethodId ?? "")
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
        const fallback: DataCollectionConfig = { type: "", levels: [] }
        setConfig(catData ? stripPersistedLevelIds(catData) : fallback)
        setItemConfig(null)
        setTeachingMethod("")
        setBaselines([])
        setObjectives([])
      }
    } catch {
      toast.error("Unable to load configuration", {
        description: "Failed to load data collection configuration.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [clientServicePlanCategoryItemId, categoryId])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  // --- Dirty state tracking ---
  const baselinesSnapshotRef = useRef("")
  const objectivesSnapshotRef = useRef("")
  const teachingMethodSnapshotRef = useRef("")

  // While false, hasUnsavedChanges stays false (no footer flash on enter).
  const [initialized, setInitialized] = useState(false)
  const baselinesRef = useRef(baselines)
  const objectivesRef = useRef(objectives)
  const teachingMethodRef = useRef(teachingMethod)
  baselinesRef.current = baselines
  objectivesRef.current = objectives
  teachingMethodRef.current = teachingMethod

  const catalogsReady = !isLoadingCatalog && !isLoadingTeachingMethods

  // Single bootstrap: reset form to final defaults only when config + catalogs are ready,
  // then snapshot baselines/objectives and enable dirty tracking after child mounts settle.
  useEffect(() => {
    if (isLoading || !config || !catalogsReady) {
      setInitialized(false)
      return
    }

    const typeItem = typeItemsMap.get(config.type ?? "")
    const values = buildItemFormValues(
      config,
      itemConfig,
      typeItem?.name ?? "",
      typeItem?.group ?? "",
    )

    reset(values)
    baselinesSnapshotRef.current = snapshotRows(baselinesRef.current)
    objectivesSnapshotRef.current = snapshotRows(objectivesRef.current)
    teachingMethodSnapshotRef.current = teachingMethodRef.current
    setInitialized(false)

    let cancelled = false
    let raf2 = 0
    // Wait 2 frames so Controllers/Selects can mount against these defaults
    // without counting as dirty, then re-baseline and enable tracking.
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return
        reset(getValues())
        baselinesSnapshotRef.current = snapshotRows(baselinesRef.current)
        objectivesSnapshotRef.current = snapshotRows(objectivesRef.current)
        teachingMethodSnapshotRef.current = teachingMethodRef.current
        setInitialized(true)
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      setInitialized(false)
    }
  }, [
    isLoading,
    config,
    itemConfig,
    catalogsReady,
    typeItemsMap,
    reset,
    getValues,
  ])

  const hasBaselineChanges = useMemo(() => {
    if (!initialized) return false
    return snapshotRows(baselines) !== baselinesSnapshotRef.current
  }, [baselines, initialized])

  const hasObjectiveChanges = useMemo(() => {
    if (!initialized) return false
    return snapshotRows(objectives) !== objectivesSnapshotRef.current
  }, [objectives, initialized])

  const hasTeachingMethodChanges =
    initialized && teachingMethod !== teachingMethodSnapshotRef.current

  const hasUnsavedChanges =
    initialized &&
    (isFormDirty || hasBaselineChanges || hasObjectiveChanges || hasTeachingMethodChanges)

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges)
  }, [hasUnsavedChanges, onDirtyChange])

  // Ref to store the form element for programmatic submission
  const formRef = useRef<HTMLFormElement>(null)

  // Guard navigation when dirty
  const guardedNavigate = useCallback(
    (action: () => void) => {
      if (!hasUnsavedChanges) {
        action()
        return
      }
      alert.confirm({
        title: "Unsaved Changes",
        description: "You have unsaved changes. Save them before leaving or discard to continue without saving.",
        confirmText: "Save",
        cancelText: "Cancel",
        onConfirm: () => {
          // Trigger form submission programmatically (save then navigate)
          formRef.current?.requestSubmit()
        },
        onCancel: () => {
          // Discard and navigate
          action()
        },
      })
    },
    [hasUnsavedChanges, alert]
  )

  // --- Watched values ---
  const watchedType = watch("type")
  const watchedIntervalLength = watch("intervalLength")

  const resolvedType = useMemo(() => {
    const item = typeItemsMap.get(watchedType)
    return { name: item?.name ?? "", group: item?.group ?? "" }
  }, [watchedType, typeItemsMap])

  const isMeasurementLogType = typeIsMeasurementLog(resolvedType.name)
  const { groups: unitMeasurementGroups, isLoading: isLoadingUnitMeasurement } =
    useUnitMeasurementCatalog(isMeasurementLogType)

  // Clear conditional fields only when the user changes type (after init).
  // Initial cleanup is done inside buildItemFormValues to keep defaults in sync.
  const prevTypeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!initialized) {
      prevTypeRef.current = watchedType
      return
    }
    if (prevTypeRef.current === watchedType) return
    prevTypeRef.current = watchedType

    const opts = { shouldDirty: true } as const
    if (
      !typeRequiresWeeklyDaily(resolvedType.name) &&
      !typeRequiresDailyAndWeekly(resolvedType.name) &&
      !typeIsMeasurementLog(resolvedType.name)
    ) {
      setValue("weeklyDailyValue", undefined, opts)
    }
    if (!typeRequiresDailyAndWeekly(resolvedType.name) && !typeIsMeasurementLog(resolvedType.name)) {
      setValue("dailyValue", undefined, opts)
    }
    if (!typeIsMeasurementLog(resolvedType.name)) {
      setValue("unitMeasurementCatalogId", undefined, opts)
    }
    if (!typeRequiresInterval(resolvedType.group)) {
      setValue("intervalLength", undefined, opts)
    }
    if (!typeRequiresInterval(resolvedType.group) && !typeRequiresDailyAndWeekly(resolvedType.name)) {
      setValue("suggestedNumberOfRecordings", undefined, opts)
    }
    if (
      !typeRequiresUnitOfTime(resolvedType.name) &&
      !typeRequiresDailyAndWeekly(resolvedType.name) &&
      !typeRequiresInterval(resolvedType.group)
    ) {
      setValue("unitOfTime", undefined, opts)
    }
    if (!typeHasCumulativeValueToggles(resolvedType.group)) {
      setValue("cumulative", undefined, opts)
    }
  }, [watchedType, resolvedType, initialized, setValue])

  // --- Delete level ---
  const handleDeleteLevel = async (level: DataCollectionLevel) => {
    if (!level.recordId) return
    try {
      await deleteClientItemLevel(level.recordId)
      toast.success("Level removed")
    } catch {
      toast.error("Unable to delete level")
      throw new Error("Failed to delete level")
    }
  }

  // --- Handlers ---
  const handleBaselinesChange = (rows: BaselineRow[]) => setBaselines(rows)
  const handleObjectivesChange = (rows: ObjectiveRow[]) => setObjectives(rows)

  // --- Save ---
  const handleSave = async (values: ClientDataCollectionFormValues) => {
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

      await upsertClientItemDataCollection({
        clientServicePlanCategoryItemId,
        name: itemName,
        teachingMethodId: teachingMethod || null,
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
      })

      // Reset dirty state BEFORE navigating away
      baselinesSnapshotRef.current = snapshotRows(baselines)
      objectivesSnapshotRef.current = snapshotRows(objectives)
      teachingMethodSnapshotRef.current = teachingMethod
      reset(values)

      toast.success("Item configuration saved")
      onSaved()
      onBack()
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

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#037ECC]" />
        </div>
      </div>
    )
  }

  // --- Render ---
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* ── Header ── */}
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => guardedNavigate(onBack)}
          disabled={isSaving}
          className="group flex items-center gap-2 text-sm font-medium text-[#037ECC] hover:text-[#025ea0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{categoryName}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 truncate max-w-[280px]">{itemName}</span>
        </button>
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

      {/* ── Content ── */}
      <div className="px-6 py-5 space-y-5">
        {/* All fields in one grid: Type + conditional fields + Teaching Method (last) + Description (full width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Type — always first */}
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

          {/* Frequency → Weekly / Daily value */}
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

          {/* Rate → Unit of time + Weekly value */}
          {typeRequiresUnitOfTime(resolvedType.name) && (
            <>
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
            </>
          )}

          {/* Measurement log */}
          {isMeasurementLogType && (
            <>
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
            </>
          )}

          {/* Duration / Response latency / Interresponse time */}
          {typeRequiresDailyAndWeekly(resolvedType.name) && (
            <>
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
            </>
          )}

          {/* Interval (time-sampling) */}
          {typeRequiresInterval(resolvedType.group) && (
            <>
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
              <div className="space-y-1 sm:col-span-2">
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
            </>
          )}

          {/* Teaching Method — always last in the grid */}
          <FloatingSelect
            label="Teaching Method"
            value={teachingMethod}
            onChange={setTeachingMethod}
            options={teachingMethodOptions}
            searchable
            disabled={isLoadingTeachingMethods}
          />

          {/* Description — full width row */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
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
        </div>

        {/* ── Baselines ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">
              Baselines
              {baselines.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500">({baselines.length})</span>
              )}
            </h3>
            <Button
              type="button"
              onClick={() => {
                const lastPeriod = baselines.length > 0 ? baselines[baselines.length - 1].periodCatalogId : ""
                handleBaselinesChange([...baselines, { ...createEmptyBaseline(), periodCatalogId: lastPeriod }])
              }}
              className="gap-1.5 text-sm h-8 px-3"
              disabled={!watchedType}
            >
              <Plus className="h-3.5 w-3.5" />
              Add baseline
            </Button>
          </div>
          <BaselinesTabContent
            baselines={baselines}
            onChange={handleBaselinesChange}
            mode="item"
            periodSelectOptions={periodSelectOptions}
            hideAddButton
          />
        </div>

        {/* ── Objectives ── */}
        <ObjectivesTabContent
          objectives={objectives}
          onChange={handleObjectivesChange}
          mode="item"
          periodMap={periodMap}
          periodSelectOptions={periodSelectOptions}
          clientFirstName={clientFirstName}
          targetName={itemName}
          dataCollectionTypeName={resolvedType.name}
          externalTitle
          hideButtons
          disableActions={baselines.length === 0}
          onModalChange={setIsModalOpen}
        />
      </div>

      {/* ── Fixed footer (overlays the layout Back button, hidden when modal is open) ── */}
      {!isModalOpen && (
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[60] backdrop-blur-md border-t shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-colors duration-300",
        hasUnsavedChanges
          ? "bg-amber-50/95 border-amber-200"
          : "bg-white/95 border-gray-200"
      )}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-amber-700">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            <div className={cn("flex items-center gap-3", !hasUnsavedChanges && "ml-auto")}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => guardedNavigate(onBack)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
                disabled={!hasUnsavedChanges && !isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}
    </form>
  )
}
