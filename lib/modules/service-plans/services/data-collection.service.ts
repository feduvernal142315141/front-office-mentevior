import {
  parseServicePlanUnitOfTime,
  parseServicePlanValueType,
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { serviceDelete, serviceGet, servicePut } from "@/lib/services/baseService"
import {
  AxisPositionX,
  AxisPositionY,
  ChartInterval,
  ChartLineType,
  DEFAULT_CHART_CONFIG,
  ObjectivesLineType,
  PointStyle,
  type ChartConfig,
  type ChartDatasetVisualConfig,
  type ChartObjectivesVisualConfig,
} from "@/lib/modules/service-plans/constants/chart.constants"
import type {
  DataCollectionConfig,
  DataCollectionLevel,
  DataCollectionType,
  ItemDataCollectionConfig,
  UpsertCategoryDataCollectionDto,
  UpsertItemDataCollectionDto,
} from "@/lib/types/data-collection.types"

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

interface ApiCategoryPayload {
  servicePlanCategoryId: string
  dataCollection: ApiDataCollection
  chart?: ApiChart
}

interface ApiCategoryResponse {
  servicePlanCategoryId?: string
  dataCollection?: ApiDataCollection
  chart?: ApiChart
  typeEventCatalogId?: string
  dailyValue?: ServicePlanValueType
  weeklyValue?: ServicePlanValueType
  unitOfTime?: ServicePlanUnitOfTime
  unitMeasurementCatalogId?: string
  recordingsNumber?: number
  intervalLength?: number
  levels?: ApiLevel[]
}

interface ApiItemPayload {
  servicePlanCategoryItemId: string
  name?: string
  topography: string
  status: boolean
  dataCollection: ApiDataCollection
  chart?: ApiChart
}

interface ApiItemResponse {
  servicePlanCategoryItemId?: string
  name?: string
  topography?: string
  status?: boolean
  dataCollection?: ApiDataCollection
  chart?: ApiChart
  typeEventCatalogId?: string
  dailyValue?: ServicePlanValueType
  weeklyValue?: ServicePlanValueType
  unitOfTime?: ServicePlanUnitOfTime
  unitMeasurementCatalogId?: string
  recordingsNumber?: number
  intervalLength?: number
  levels?: ApiLevel[]
}

type DataCollectionDtoFields = {
  type: DataCollectionType
  weeklyDailyValue?: ServicePlanValueType
  dailyValue?: ServicePlanValueType
  unitMeasurementCatalogId?: string
  levels: UpsertCategoryDataCollectionDto["levels"]
  intervalLength?: number
  unitOfTime?: ServicePlanUnitOfTime
  suggestedNumberOfRecordings?: number
}

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

function asEnum<T extends string>(
  value: unknown,
  enumObject: Record<string, T>,
  fallback: T
): T {
  if (typeof value !== "string") return fallback
  const upper = value.toUpperCase()
  const values = Object.values(enumObject) as string[]
  return (values.includes(upper) ? (upper as T) : fallback)
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
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null

      const level = entry as ApiLevel
      const label = asString(level.level)
      const description = asString(level.description)
      const id = asOptionalString(level.id)

      if (label.length === 0 && description.length === 0) return null

      return {
        id: crypto.randomUUID(),
        ...(id ? { recordId: id } : {}),
        label,
        description,
      } satisfies DataCollectionLevel
    })
    .filter((entry): entry is DataCollectionLevel => entry !== null)
}

function extractApiDataCollection(
  response: ApiCategoryResponse | ApiItemResponse
): ApiDataCollection | null {
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
  const typeEventCatalogId = asString(dc.typeEventCatalogId)
  const dailyValue = parseServicePlanValueType(dc.dailyValue)
  const weeklyDailyValue = parseServicePlanValueType(dc.weeklyValue)
  const unitOfTime = parseServicePlanUnitOfTime(dc.unitOfTime)
  const unitMeasurementCatalogId = asOptionalString(dc.unitMeasurementCatalogId)
  const suggestedNumberOfRecordings = asOptionalNumber(dc.recordingsNumber)
  const intervalLength = asOptionalNumber(dc.intervalLength)
  const levels = normalizeLevels(dc.levels)

  return {
    type: typeEventCatalogId,
    dailyValue,
    weeklyDailyValue,
    unitOfTime,
    unitMeasurementCatalogId,
    suggestedNumberOfRecordings,
    intervalLength,
    levels,
  }
}

function fromApiDataset(dataset: ApiChartDataset): ChartDatasetVisualConfig {
  const config: ChartDatasetVisualConfig = {
    title: asString(dataset.title),
    axis: asString(dataset.axis),
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
    borderColor:
      asString(chart.borderColorObjectives) || DEFAULT_CHART_CONFIG.objectives!.borderColor,
    lineType: asEnum(
      chart.lineTypeObjectives,
      ObjectivesLineType,
      ObjectivesLineType.DASHED
    ),
    showBackground: asBoolean(chart.showBackgroundObjectives),
    backgroundColor:
      asString(chart.backgroundColorObjectives) ||
      DEFAULT_CHART_CONFIG.objectives!.backgroundColor,
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
      title: asString(chart.titleYAxes) || DEFAULT_CHART_CONFIG.yAxis.title,
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
    config.weeklyDailyValue !== undefined ||
    config.unitOfTime !== undefined ||
    config.unitMeasurementCatalogId !== undefined ||
    config.suggestedNumberOfRecordings !== undefined ||
    config.intervalLength !== undefined
  )
}

function fromApiCategoryResponse(raw: unknown): DataCollectionConfig | null {
  const entity = extractEntity(raw)
  if (!entity || typeof entity !== "object") return null

  const response = entity as ApiCategoryResponse
  const dataCollection = extractApiDataCollection(response)
  const chartRaw = response.chart
  const hasChart = hasChartContent(chartRaw)

  if (!dataCollection && !hasChart) return null

  const config = dataCollection
    ? fromApiDataCollection(dataCollection)
    : ({ type: "", levels: [] as DataCollectionLevel[] } satisfies DataCollectionConfig)

  if (hasChart && chartRaw) {
    config.chart = fromApiChart(chartRaw)
  }

  if (!hasDataCollectionContent(config) && !config.chart) return null
  return config
}

function fromApiItemResponse(
  raw: unknown,
  fallbackItemId: string
): ItemDataCollectionConfig | null {
  const entity = extractEntity(raw)
  if (!entity || typeof entity !== "object") return null

  const itemEntity = entity as ApiItemResponse
  const dataCollection = extractApiDataCollection(itemEntity)
  const chartRaw = itemEntity.chart
  const hasChart = hasChartContent(chartRaw)
  const topography = asString(itemEntity.topography)
  const active = typeof itemEntity.status === "boolean" ? itemEntity.status : true
  const name = asString(itemEntity.name)
  const itemId = asOptionalString(itemEntity.servicePlanCategoryItemId) ?? fallbackItemId

  const base = dataCollection
    ? fromApiDataCollection(dataCollection)
    : { type: "", levels: [] as DataCollectionLevel[] }

  if (hasChart && chartRaw) {
    base.chart = fromApiChart(chartRaw)
  }

  const hasContent =
    hasDataCollectionContent(base) ||
    !!base.chart ||
    topography.length > 0 ||
    typeof itemEntity.status === "boolean"

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

function toApiDataCollection(dto: DataCollectionDtoFields): ApiDataCollection {
  const dataCollection: ApiDataCollection = {
    typeEventCatalogId: dto.type,
    levels: dto.levels.map((level) => {
      const entry: ApiLevel = {
        level: level.label,
        description: level.description,
      }
      if (level.id) entry.id = level.id
      return entry
    }),
  }

  if (dto.dailyValue) {
    dataCollection.dailyValue = dto.dailyValue
  }
  if (dto.weeklyDailyValue) {
    dataCollection.weeklyValue = dto.weeklyDailyValue
  }
  if (dto.unitOfTime) {
    dataCollection.unitOfTime = dto.unitOfTime
  }
  if (dto.unitMeasurementCatalogId) {
    dataCollection.unitMeasurementCatalogId = dto.unitMeasurementCatalogId
  }
  if (dto.suggestedNumberOfRecordings !== undefined) {
    dataCollection.recordingsNumber = dto.suggestedNumberOfRecordings
  }
  if (dto.intervalLength !== undefined) {
    dataCollection.intervalLength = dto.intervalLength
  }

  return dataCollection
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

  if (chart.yAxis.suggestedMin !== undefined) {
    apiChart.suggestedMinYAxes = chart.yAxis.suggestedMin
  }
  if (chart.yAxis.suggestedMax !== undefined) {
    apiChart.suggestedMaxYAxes = chart.yAxis.suggestedMax
  }

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

function toApiCategoryPayload(dto: UpsertCategoryDataCollectionDto): ApiCategoryPayload {
  const payload: ApiCategoryPayload = {
    servicePlanCategoryId: dto.servicePlanCategoryId,
    dataCollection: toApiDataCollection(dto),
  }
  if (dto.chart) payload.chart = toApiChart(dto.chart)
  return payload
}

function toApiItemPayload(dto: UpsertItemDataCollectionDto): ApiItemPayload {
  const payload: ApiItemPayload = {
    servicePlanCategoryItemId: dto.servicePlanCategoryItemId,
    topography: dto.topography,
    status: dto.active,
    dataCollection: toApiDataCollection(dto),
  }

  if (dto.name?.trim()) {
    payload.name = dto.name.trim()
  }
  if (dto.chart) payload.chart = toApiChart(dto.chart)

  return payload
}

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback
  const payload = data as { message?: unknown; details?: unknown }
  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message
  }
  if (typeof payload.details === "string" && payload.details.trim().length > 0) {
    return payload.details
  }
  return fallback
}

export async function getCategoryDataCollection(
  servicePlanCategoryId: string
): Promise<DataCollectionConfig | null> {
  const response = await serviceGet<unknown>(
    `/service-plan-category/${servicePlanCategoryId}/level`
  )

  if (response?.status === 404) return null

  if (!response || (response.status !== 200 && response.status !== 204)) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to load category data collection")
    )
  }

  if (response.status === 204 || !response.data) return null

  return fromApiCategoryResponse(response.data)
}

export async function deleteServicePlanCategoryLevel(
  servicePlanCategoryLevelId: string
): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/service-plan-category-level/${servicePlanCategoryLevelId}`
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete level"))
  }
}

export async function upsertCategoryDataCollection(
  dto: UpsertCategoryDataCollectionDto
): Promise<void> {
  const payload = toApiCategoryPayload(dto)
  const response = await servicePut<ApiCategoryPayload, unknown>(
    `/service-plan-category/${dto.servicePlanCategoryId}/level`,
    payload
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to save category data collection")
    )
  }
}

export async function getItemDataCollection(
  servicePlanCategoryItemId: string
): Promise<ItemDataCollectionConfig | null> {
  const response = await serviceGet<unknown>(
    `/service-plan-category-item/${servicePlanCategoryItemId}/level`
  )

  if (response?.status === 404) return null

  if (!response || (response.status !== 200 && response.status !== 204)) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to load item data collection")
    )
  }

  if (response.status === 204 || !response.data) return null

  return fromApiItemResponse(response.data, servicePlanCategoryItemId)
}

export async function deleteServicePlanCategoryItemLevel(
  servicePlanCategoryItemLevelId: string
): Promise<void> {
  const response = await serviceDelete<unknown>(
    `/service-plan-category-item-level/${servicePlanCategoryItemLevelId}`
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete level"))
  }
}

export async function upsertItemDataCollection(
  dto: UpsertItemDataCollectionDto
): Promise<void> {
  const payload = toApiItemPayload(dto)
  const response = await servicePut<ApiItemPayload, unknown>(
    `/service-plan-category-item/${dto.servicePlanCategoryItemId}/level`,
    payload
  )

  if (
    !response ||
    (response.status !== 200 && response.status !== 201 && response.status !== 204)
  ) {
    throw new Error(
      getApiErrorMessage(response?.data, "Failed to save item data collection")
    )
  }
}
