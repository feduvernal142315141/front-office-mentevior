import {
  parseServicePlanUnitOfTime,
  parseServicePlanValueType,
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { serviceDelete, serviceGet, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import {
  AxisPositionX,
  AxisPositionY,
  ChartInterval,
  ChartLineType,
  DEFAULT_CHART_CONFIG,
  ObjectivesLineType,
  PointStyle,
  normalizeAxisTitle,
  type ChartConfig,
  type ChartDatasetVisualConfig,
  type ChartObjectivesVisualConfig,
} from "@/lib/modules/service-plans/constants/chart.constants"
import type {
  DataCollectionBaselineData,
  DataCollectionConfig,
  DataCollectionLevel,
  DataCollectionObjectiveData,
  DataCollectionType,
  ItemDataCollectionConfig,
} from "@/lib/types/data-collection.types"
import type {
  ApiRecommendationsPayload,
  RecommendationsConfig,
} from "@/lib/types/client-service-plan.types"

// --- Internal API shapes (mirror of data-collection.service.ts) ---

interface ApiLevel {
  id?: string
  level?: string
  description?: string
}

interface ApiDataCollection {
  typeEventCatalogId?: string
  dailyValue?: ServicePlanValueType
  weeklyValue?: ServicePlanValueType
  unitOfTime?: ServicePlanUnitOfTime
  unitMeasurementCatalogId?: string
  recordingsNumber?: number
  intervalLength?: number
  levels?: ApiLevel[]
}

interface ApiChartDataset {
  datasetCatalogId?: string
  title?: string
  axis?: string
  type?: ChartLineType | string
  pointStyle?: PointStyle | string
  spanGaps?: boolean
  showValues?: boolean
  unpin?: boolean
  stacked?: boolean
  borderColor?: string
  backgroundColor?: string
  trendlineColor?: string
}

interface ApiChart {
  interval?: ChartInterval | string
  titleXAxes?: string
  positionXAxes?: AxisPositionX | string
  hideGridXAxes?: boolean
  titleYAxes?: string
  positionYAxes?: AxisPositionY | string
  hideGridYAxes?: boolean
  suggestedMinYAxes?: number
  suggestedMaxYAxes?: number
  showLabelObjectives?: boolean
  showLineObjectives?: boolean
  showBackgroundObjectives?: boolean
  fontColorObjectives?: string
  borderColorObjectives?: string
  backgroundColorObjectives?: string
  lineTypeObjectives?: ObjectivesLineType | string
  datasets?: ApiChartDataset[]
}

// --- Baselines ---

interface ApiBaseline {
  id?: string
  date?: string
  value?: number | string
  periodCatalogId?: string
  comments?: string
  show?: boolean | number | string
}

function normalizeBaselines(raw: unknown): DataCollectionBaselineData[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry): DataCollectionBaselineData | null => {
      if (!entry || typeof entry !== "object") return null
      const b = entry as ApiBaseline
      const date = asString(b.date)
      if (!date) return null
      return {
        recordId: asOptionalString(b.id),
        date,
        value: asOptionalNumber(b.value) ?? 0,
        periodCatalogId: asString(b.periodCatalogId),
        comments: asString(b.comments),
        show: asBoolean(b.show, true),
      }
    })
    .filter((b): b is DataCollectionBaselineData => b !== null)
}

interface ApiObjective {
  id?: string
  name?: string
  startDate?: string
  estimatedEndDate?: string
  endDate?: string
  operatorSmartCriteria?: string
  valueSmartCriteria?: number | string
  periodSmartCriteriaCatalogId?: string
  valueDuration?: number | string
  periodDurationCatalogId?: string
}

function normalizeObjectives(raw: unknown): DataCollectionObjectiveData[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry): DataCollectionObjectiveData | null => {
      if (!entry || typeof entry !== "object") return null
      const o = entry as ApiObjective
      return {
        recordId: asOptionalString(o.id),
        name: asString(o.name),
        startDate: asString(o.startDate),
        estimatedEndDate: asString(o.estimatedEndDate),
        endDate: asString(o.endDate),
        operatorSmartCriteria: asString(o.operatorSmartCriteria),
        valueSmartCriteria: asOptionalNumber(o.valueSmartCriteria) ?? 0,
        periodSmartCriteriaCatalogId: asString(o.periodSmartCriteriaCatalogId),
        valueDuration: asOptionalNumber(o.valueDuration) ?? 0,
        periodDurationCatalogId: asString(o.periodDurationCatalogId),
      }
    })
    .filter((o): o is DataCollectionObjectiveData => o !== null)
}

function toApiObjectives(objectives: DataCollectionObjectiveData[]): ApiObjective[] {
  return objectives.map((o) => ({
    ...(o.recordId ? { id: o.recordId } : {}),
    name: o.name,
    startDate: o.startDate,
    estimatedEndDate: o.estimatedEndDate,
    endDate: o.endDate,
    operatorSmartCriteria: o.operatorSmartCriteria,
    valueSmartCriteria: o.valueSmartCriteria,
    periodSmartCriteriaCatalogId: o.periodSmartCriteriaCatalogId,
    valueDuration: o.valueDuration,
    periodDurationCatalogId: o.periodDurationCatalogId,
  }))
}

// --- Recommendations ---

interface ApiRecommendationItem {
  id?: string
  name?: string
}

interface ApiRecommendation {
  strategyId?: string
  activitiesToOccurrence?: ApiRecommendationItem[]
  preventiveStrategies?: ApiRecommendationItem[]
  replacements?: ApiRecommendationItem[]
  interventions?: ApiRecommendationItem[]
  reinforcers?: ApiRecommendationItem[]
}

function fromApiRecommendations(raw: unknown): RecommendationsConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const rec = raw as ApiRecommendation
  const strategyId = asString(rec.strategyId)
  const extractIds = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return []
    return arr
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && "id" in item) return asString((item as ApiRecommendationItem).id)
        return ""
      })
      .filter((id) => id.length > 0)
  }
  const activitiesToOccurrence = extractIds(rec.activitiesToOccurrence)
  const preventiveStrategies = extractIds(rec.preventiveStrategies)
  const replacements = extractIds(rec.replacements)
  const interventions = extractIds(rec.interventions)
  const reinforcers = extractIds(rec.reinforcers)
  const hasContent =
    strategyId.length > 0 ||
    activitiesToOccurrence.length > 0 ||
    preventiveStrategies.length > 0 ||
    replacements.length > 0 ||
    interventions.length > 0 ||
    reinforcers.length > 0
  if (!hasContent) return undefined
  return { strategyId, activitiesToOccurrence, preventiveStrategies, replacements, interventions, reinforcers }
}

function toApiRecommendations(rec: RecommendationsConfig | undefined): ApiRecommendationsPayload {
  if (!rec) {
    return {
      strategyId: null,
      activitiesToOccurrence: null,
      preventiveStrategies: null,
      replacements: null,
      interventions: null,
      reinforcers: null,
    }
  }
  return {
    strategyId: rec.strategyId || null,
    activitiesToOccurrence: rec.activitiesToOccurrence.length > 0 ? rec.activitiesToOccurrence : null,
    preventiveStrategies: rec.preventiveStrategies.length > 0 ? rec.preventiveStrategies : null,
    replacements: rec.replacements.length > 0 ? rec.replacements : null,
    interventions: rec.interventions.length > 0 ? rec.interventions : null,
    reinforcers: rec.reinforcers.length > 0 ? rec.reinforcers : null,
  }
}

// Client-specific payload shapes
interface ClientCategoryPayload {
  clientServicePlanCategoryId: string
  dataCollection: ApiDataCollection
  chart?: ApiChart
  baseline?: ApiBaseline[]
  objetive?: ApiObjective[]
  recommendation?: ApiRecommendationsPayload
}

interface ClientItemPayload {
  clientServicePlanCategoryItemId: string
  name?: string
  topography: string
  status: boolean
  dataCollection: ApiDataCollection
  chart?: ApiChart
  baseline?: ApiBaseline[]
  objetive?: ApiObjective[]
  recommendation?: ApiRecommendationsPayload
}

interface ApiResponse {
  dataCollection?: ApiDataCollection
  chart?: ApiChart
  baseline?: ApiBaseline[]
  objetive?: ApiObjective[]
  recommendation?: ApiRecommendation
  typeEventCatalogId?: string
  dailyValue?: ServicePlanValueType
  weeklyValue?: ServicePlanValueType
  unitOfTime?: ServicePlanUnitOfTime
  unitMeasurementCatalogId?: string
  recordingsNumber?: number
  intervalLength?: number
  levels?: ApiLevel[]
  topography?: string
  status?: boolean
  name?: string
  clientServicePlanCategoryItemId?: string
}

export interface UpsertClientCategoryDataCollectionDto {
  clientServicePlanCategoryId: string
  type: DataCollectionType
  weeklyDailyValue?: ServicePlanValueType
  dailyValue?: ServicePlanValueType
  unitMeasurementCatalogId?: string
  levels: Array<{ id?: string; label: string; description: string; value?: boolean }>
  intervalLength?: number
  unitOfTime?: ServicePlanUnitOfTime
  suggestedNumberOfRecordings?: number
  cumulative?: boolean
  chart?: ChartConfig
  baselines?: DataCollectionBaselineData[]
  objectives?: DataCollectionObjectiveData[]
  recommendations?: RecommendationsConfig
}

export interface UpsertClientItemDataCollectionDto {
  clientServicePlanCategoryItemId: string
  name?: string
  topography: string
  active: boolean
  type: DataCollectionType
  weeklyDailyValue?: ServicePlanValueType
  dailyValue?: ServicePlanValueType
  unitMeasurementCatalogId?: string
  levels: Array<{ id?: string; label: string; description: string; value?: boolean }>
  intervalLength?: number
  unitOfTime?: ServicePlanUnitOfTime
  suggestedNumberOfRecordings?: number
  cumulative?: boolean
  chart?: ChartConfig
  baselines?: DataCollectionBaselineData[]
  objectives?: DataCollectionObjectiveData[]
  recommendations?: RecommendationsConfig
}

// --- Normalization helpers ---

function asString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function asOptionalString(value: unknown): string | undefined {
  const parsed = asString(value).trim()
  return parsed.length > 0 ? parsed : undefined
}

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  return fallback
}

function asEnum<T extends string>(value: unknown, enumObject: Record<string, T>, fallback: T): T {
  if (typeof value !== "string") return fallback
  const upper = value.toUpperCase()
  const values = Object.values(enumObject) as string[]
  return values.includes(upper) ? (upper as T) : fallback
}

function extractEntity(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw
  const wrapped = raw as { entity?: unknown; data?: unknown }
  if (wrapped.entity && typeof wrapped.entity === "object") return wrapped.entity
  if (wrapped.data && typeof wrapped.data === "object") {
    const dataEntity = (wrapped.data as { entity?: unknown }).entity
    if (dataEntity && typeof dataEntity === "object") return dataEntity
    return wrapped.data
  }
  return raw
}

function normalizeLevels(rawLevels: unknown): DataCollectionLevel[] {
  if (!Array.isArray(rawLevels)) return []
  return rawLevels
    .map((entry): DataCollectionLevel | null => {
      if (!entry || typeof entry !== "object") return null
      const level = entry as ApiLevel
      const label = asString(level.level)
      const description = asString(level.description)
      const id = asOptionalString(level.id)
      if (!label && !description) return null
      return {
        id: crypto.randomUUID(),
        ...(id ? { recordId: id } : {}),
        label,
        description,
      }
    })
    .filter((entry): entry is DataCollectionLevel => entry !== null)
}

function extractApiDataCollection(response: ApiResponse): ApiDataCollection | null {
  if (response.dataCollection && typeof response.dataCollection === "object") {
    return response.dataCollection
  }
  const typeEventCatalogId = asOptionalString(response.typeEventCatalogId)
  const hasLegacyFields =
    typeEventCatalogId ||
    response.dailyValue ||
    response.weeklyValue ||
    response.unitOfTime ||
    asOptionalString(response.unitMeasurementCatalogId) ||
    response.recordingsNumber !== undefined ||
    response.intervalLength !== undefined ||
    (Array.isArray(response.levels) && response.levels.length > 0)
  if (!hasLegacyFields) return null
  return {
    typeEventCatalogId,
    dailyValue: response.dailyValue,
    weeklyValue: response.weeklyValue,
    unitOfTime: response.unitOfTime,
    unitMeasurementCatalogId: asOptionalString(response.unitMeasurementCatalogId),
    recordingsNumber: response.recordingsNumber,
    intervalLength: response.intervalLength,
    levels: response.levels,
  }
}

function fromApiDataCollection(dc: ApiDataCollection): DataCollectionConfig {
  return {
    type: asString(dc.typeEventCatalogId),
    dailyValue: parseServicePlanValueType(dc.dailyValue),
    weeklyDailyValue: parseServicePlanValueType(dc.weeklyValue),
    unitOfTime: parseServicePlanUnitOfTime(dc.unitOfTime),
    unitMeasurementCatalogId: asOptionalString(dc.unitMeasurementCatalogId),
    suggestedNumberOfRecordings: asOptionalNumber(dc.recordingsNumber),
    intervalLength: asOptionalNumber(dc.intervalLength),
    levels: normalizeLevels(dc.levels),
  }
}

function fromApiDataset(dataset: ApiChartDataset): ChartDatasetVisualConfig {
  const config: ChartDatasetVisualConfig = {
    title: asString(dataset.title),
    axis: normalizeAxisTitle(asString(dataset.axis)),
    type: asEnum(dataset.type, ChartLineType, ChartLineType.LINE),
    pointStyle: asEnum(dataset.pointStyle, PointStyle, PointStyle.CIRCLE),
    borderColor: asString(dataset.borderColor),
    backgroundColor: asString(dataset.backgroundColor),
    trendlineColor: asString(dataset.trendlineColor),
    spanGaps: asBoolean(dataset.spanGaps),
    showValues: asBoolean(dataset.showValues),
  }
  if (typeof dataset.unpin === "boolean") config.unpin = dataset.unpin
  if (typeof dataset.stacked === "boolean") config.stacked = dataset.stacked
  return config
}

function fromApiChart(chart: ApiChart): ChartConfig {
  const datasets = Array.isArray(chart.datasets) ? chart.datasets : []
  const datasetIds: string[] = []
  const datasetConfigs: Record<string, ChartDatasetVisualConfig> = {}
  for (const dataset of datasets) {
    const id = asOptionalString(dataset.datasetCatalogId)
    if (!id) continue
    datasetIds.push(id)
    datasetConfigs[id] = fromApiDataset(dataset)
  }
  const objectives: ChartObjectivesVisualConfig = {
    showLabel: asBoolean(chart.showLabelObjectives, true),
    fontColor: asString(chart.fontColorObjectives) || DEFAULT_CHART_CONFIG.objectives!.fontColor,
    showLine: asBoolean(chart.showLineObjectives, true),
    borderColor: asString(chart.borderColorObjectives) || DEFAULT_CHART_CONFIG.objectives!.borderColor,
    lineType: asEnum(chart.lineTypeObjectives, ObjectivesLineType, ObjectivesLineType.DASHED),
    showBackground: asBoolean(chart.showBackgroundObjectives),
    backgroundColor:
      asString(chart.backgroundColorObjectives) || DEFAULT_CHART_CONFIG.objectives!.backgroundColor,
  }
  return {
    datasets: datasetIds,
    interval: asEnum(chart.interval, ChartInterval, DEFAULT_CHART_CONFIG.interval),
    xAxis: {
      title: asString(chart.titleXAxes),
      position: asEnum(chart.positionXAxes, AxisPositionX, AxisPositionX.BOTTOM),
      hideGrid: asBoolean(chart.hideGridXAxes),
    },
    yAxis: {
      title: normalizeAxisTitle(asString(chart.titleYAxes)) || DEFAULT_CHART_CONFIG.yAxis.title,
      position: asEnum(chart.positionYAxes, AxisPositionY, AxisPositionY.LEFT),
      hideGrid: asBoolean(chart.hideGridYAxes),
      suggestedMin: asOptionalNumber(chart.suggestedMinYAxes),
      suggestedMax: asOptionalNumber(chart.suggestedMaxYAxes),
    },
    datasetConfigs,
    objectives,
  }
}

function hasChartContent(chart?: ApiChart): boolean {
  if (!chart || typeof chart !== "object") return false
  return (
    !!chart.interval ||
    !!chart.titleXAxes ||
    !!chart.titleYAxes ||
    (Array.isArray(chart.datasets) && chart.datasets.length > 0)
  )
}

function hasDataCollectionContent(config: DataCollectionConfig): boolean {
  return (
    config.type.length > 0 ||
    config.levels.length > 0 ||
    config.dailyValue !== undefined ||
    config.weeklyDailyValue !== undefined
  )
}

function fromApiResponse(raw: unknown): DataCollectionConfig | null {
  const entity = extractEntity(raw)
  if (!entity || typeof entity !== "object") return null
  const response = entity as ApiResponse
  const dataCollection = extractApiDataCollection(response)
  const chartRaw = response.chart
  const hasChart = hasChartContent(chartRaw)
  if (!dataCollection && !hasChart) return null
  const config = dataCollection
    ? fromApiDataCollection(dataCollection)
    : ({ type: "", levels: [] as DataCollectionLevel[] } satisfies DataCollectionConfig)
  if (hasChart && chartRaw) config.chart = fromApiChart(chartRaw)
  config.baselines = normalizeBaselines(response.baseline)
  config.objectives = normalizeObjectives(response.objetive)
  config.recommendations = fromApiRecommendations(response.recommendation)
  if (!hasDataCollectionContent(config) && !config.chart && !config.baselines.length && !config.objectives.length && !config.recommendations) return null
  return config
}

function fromApiItemResponse(raw: unknown, fallbackItemId: string): ItemDataCollectionConfig | null {
  const entity = extractEntity(raw)
  if (!entity || typeof entity !== "object") return null
  const itemEntity = entity as ApiResponse
  const dataCollection = extractApiDataCollection(itemEntity)
  const chartRaw = itemEntity.chart
  const hasChart = hasChartContent(chartRaw)
  const topography = asString(itemEntity.topography)
  const active = typeof itemEntity.status === "boolean" ? itemEntity.status : true
  const name = asString(itemEntity.name)
  const itemId = asOptionalString(itemEntity.clientServicePlanCategoryItemId) ?? fallbackItemId
  const base = dataCollection
    ? fromApiDataCollection(dataCollection)
    : { type: "", levels: [] as DataCollectionLevel[] }
  if (hasChart && chartRaw) base.chart = fromApiChart(chartRaw)
  base.baselines = normalizeBaselines(itemEntity.baseline)
  base.objectives = normalizeObjectives(itemEntity.objetive)
  base.recommendations = fromApiRecommendations(itemEntity.recommendation)
  const hasContent =
    hasDataCollectionContent(base) ||
    !!base.chart ||
    topography.length > 0 ||
    typeof itemEntity.status === "boolean" ||
    (base.baselines && base.baselines.length > 0) ||
    (base.objectives && base.objectives.length > 0) ||
    !!base.recommendations
  if (!hasContent) return null
  return {
    ...base,
    itemId,
    itemName: name,
    categoryId: "",
    categoryName: "",
    topography,
    active,
    isCustomOverride: !!dataCollection && hasDataCollectionContent(base),
  }
}

// --- Serialize to API ---

function toApiDataCollection(dto: UpsertClientCategoryDataCollectionDto | UpsertClientItemDataCollectionDto): ApiDataCollection {
  const dc: ApiDataCollection = {
    typeEventCatalogId: dto.type,
    levels: dto.levels.map((level) => {
      const entry: ApiLevel = { level: level.label, description: level.description }
      if (level.id) entry.id = level.id
      return entry
    }),
  }
  if (dto.dailyValue) dc.dailyValue = dto.dailyValue
  if (dto.weeklyDailyValue) dc.weeklyValue = dto.weeklyDailyValue
  if (dto.unitOfTime) dc.unitOfTime = dto.unitOfTime
  if (dto.unitMeasurementCatalogId) dc.unitMeasurementCatalogId = dto.unitMeasurementCatalogId
  if (dto.suggestedNumberOfRecordings !== undefined) dc.recordingsNumber = dto.suggestedNumberOfRecordings
  if (dto.intervalLength !== undefined) dc.intervalLength = dto.intervalLength
  return dc
}

function toApiChart(chart: ChartConfig): ApiChart {
  const datasets: ApiChartDataset[] = chart.datasets.map((datasetId) => {
    const config = chart.datasetConfigs?.[datasetId]
    const entry: ApiChartDataset = {
      datasetCatalogId: datasetId,
      title: config?.title ?? "",
      axis: config?.axis ?? chart.yAxis.title,
      type: config?.type ?? ChartLineType.LINE,
      pointStyle: config?.pointStyle ?? PointStyle.CIRCLE,
      spanGaps: !!config?.spanGaps,
      showValues: !!config?.showValues,
      unpin: !!config?.unpin,
      borderColor: config?.borderColor ?? "",
      backgroundColor: config?.backgroundColor ?? "",
      trendlineColor: config?.trendlineColor ?? "",
    }
    if (typeof config?.stacked === "boolean") entry.stacked = config.stacked
    return entry
  })
  const apiChart: ApiChart = {
    interval: chart.interval,
    titleXAxes: chart.xAxis.title,
    positionXAxes: chart.xAxis.position,
    hideGridXAxes: chart.xAxis.hideGrid,
    titleYAxes: chart.yAxis.title,
    positionYAxes: chart.yAxis.position,
    hideGridYAxes: chart.yAxis.hideGrid,
    datasets,
  }
  if (chart.yAxis.suggestedMin !== undefined) apiChart.suggestedMinYAxes = chart.yAxis.suggestedMin
  if (chart.yAxis.suggestedMax !== undefined) apiChart.suggestedMaxYAxes = chart.yAxis.suggestedMax
  if (chart.objectives) {
    apiChart.showLabelObjectives = chart.objectives.showLabel
    apiChart.showLineObjectives = chart.objectives.showLine
    apiChart.showBackgroundObjectives = chart.objectives.showBackground
    apiChart.fontColorObjectives = chart.objectives.fontColor
    apiChart.borderColorObjectives = chart.objectives.borderColor
    apiChart.backgroundColorObjectives = chart.objectives.backgroundColor
    apiChart.lineTypeObjectives = chart.objectives.lineType
  }
  return apiChart
}

function toApiBaselines(baselines: DataCollectionBaselineData[]): ApiBaseline[] {
  return baselines.map((b) => ({
    ...(b.recordId ? { id: b.recordId } : {}),
    date: b.date,
    value: b.value,
    periodCatalogId: b.periodCatalogId,
    comments: b.comments,
    show: b.show,
  }))
}

// --- Public API ---

export async function getClientCategoryDataCollection(
  clientServicePlanCategoryId: string
): Promise<DataCollectionConfig | null> {
  const response = await serviceGet<unknown>(
    `/client-service-plan-category/${clientServicePlanCategoryId}/level`
  )
  if (response?.status === 404) return null
  if (!response || (response.status !== 200 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load category data collection"))
  }
  if (response.status === 204 || !response.data) return null
  return fromApiResponse(response.data)
}

export async function upsertClientCategoryDataCollection(
  dto: UpsertClientCategoryDataCollectionDto
): Promise<void> {
  const payload: ClientCategoryPayload = {
    clientServicePlanCategoryId: dto.clientServicePlanCategoryId,
    dataCollection: toApiDataCollection(dto),
  }
  if (dto.chart) payload.chart = toApiChart(dto.chart)
  payload.baseline = dto.baselines ? toApiBaselines(dto.baselines) : []
  payload.objetive = dto.objectives ? toApiObjectives(dto.objectives) : []
  payload.recommendation = toApiRecommendations(dto.recommendations)
  const response = await servicePut<ClientCategoryPayload, unknown>(
    `/client-service-plan-category/level`,
    payload
  )
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to save category data collection"))
  }
}

export async function deleteClientCategoryLevel(levelId: string): Promise<void> {
  const response = await serviceDelete<unknown>(`/client-service-plan-category-level/${levelId}`)
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete level"))
  }
}

export async function getClientItemDataCollection(
  clientServicePlanCategoryItemId: string
): Promise<ItemDataCollectionConfig | null> {
  const response = await serviceGet<unknown>(
    `/client-service-plan-category-item/${clientServicePlanCategoryItemId}/level`
  )
  if (response?.status === 404) return null
  if (!response || (response.status !== 200 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load item data collection"))
  }
  if (response.status === 204 || !response.data) return null
  return fromApiItemResponse(response.data, clientServicePlanCategoryItemId)
}

export async function upsertClientItemDataCollection(
  dto: UpsertClientItemDataCollectionDto
): Promise<void> {
  const payload: ClientItemPayload = {
    clientServicePlanCategoryItemId: dto.clientServicePlanCategoryItemId,
    topography: dto.topography,
    status: dto.active,
    dataCollection: toApiDataCollection(dto),
  }
  if (dto.name?.trim()) payload.name = dto.name.trim()
  if (dto.chart) payload.chart = toApiChart(dto.chart)
  payload.baseline = dto.baselines ? toApiBaselines(dto.baselines) : []
  payload.objetive = dto.objectives ? toApiObjectives(dto.objectives) : []
  payload.recommendation = toApiRecommendations(dto.recommendations)
  const response = await servicePut<ClientItemPayload, unknown>(
    `/client-service-plan-category-item/level`,
    payload
  )
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to save item data collection"))
  }
}

export async function deleteClientItemLevel(levelId: string): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/client-service-plan-category-item-level/${levelId}`
  )
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete level"))
  }
}

// --- Baseline deletes ---

export async function deleteClientCategoryBaseline(baselineId: string): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/client-service-plan-category-baseline/${baselineId}`
  )
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete baseline"))
  }
}

export async function deleteClientItemBaseline(baselineId: string): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/client-service-plan-category-item-baseline/${baselineId}`
  )
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete baseline"))
  }
}

// --- Objective deletes ---

export async function deleteClientCategoryObjective(objectiveId: string): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/client-service-plan-category-objetive/${objectiveId}`
  )
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete objective"))
  }
}

export async function deleteClientItemObjective(objectiveId: string): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/client-service-plan-category-item-objetive/${objectiveId}`
  )
  if (!response || (response.status !== 200 && response.status !== 201 && response.status !== 204)) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete objective"))
  }
}
