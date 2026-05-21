export const ChartInterval = {
  SESSION: "SESSION",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
} as const
export type ChartInterval = (typeof ChartInterval)[keyof typeof ChartInterval]

export const CHART_INTERVAL_OPTIONS: { value: ChartInterval; label: string }[] = [
  { value: ChartInterval.SESSION, label: "Session" },
  { value: ChartInterval.DAILY, label: "Daily" },
  { value: ChartInterval.WEEKLY, label: "Weekly" },
  { value: ChartInterval.MONTHLY, label: "Monthly" },
  { value: ChartInterval.QUARTERLY, label: "Quarterly" },
  { value: ChartInterval.YEARLY, label: "Yearly" },
]

export const KNOWN_DATASET_NAMES = {
  BASELINE: "Baseline",
  TOTAL: "Total",
  OBJECTIVES: "Objectives",
  TAGS: "Tags",
  SESSIONS_COUNT: "Sessions (count)",
} as const

function normalizeDatasetName(name: string): string {
  return name.trim().toLowerCase()
}

export function isObjectivesDataset(name: string): boolean {
  return normalizeDatasetName(name) === normalizeDatasetName(KNOWN_DATASET_NAMES.OBJECTIVES)
}

export function isBaselineDataset(name: string): boolean {
  return normalizeDatasetName(name) === normalizeDatasetName(KNOWN_DATASET_NAMES.BASELINE)
}

export function isStackedDataset(name: string): boolean {
  const lower = normalizeDatasetName(name)
  return (
    lower === normalizeDatasetName(KNOWN_DATASET_NAMES.TAGS) ||
    lower === normalizeDatasetName(KNOWN_DATASET_NAMES.SESSIONS_COUNT)
  )
}

export const AxisPositionX = {
  TOP: "TOP",
  BOTTOM: "BOTTOM",
} as const
export type AxisPositionX = (typeof AxisPositionX)[keyof typeof AxisPositionX]

export const AXIS_POSITION_X_OPTIONS: { value: AxisPositionX; label: string }[] = [
  { value: AxisPositionX.TOP, label: "Top" },
  { value: AxisPositionX.BOTTOM, label: "Bottom" },
]

export const AxisPositionY = {
  LEFT: "LEFT",
  RIGHT: "RIGHT",
} as const
export type AxisPositionY = (typeof AxisPositionY)[keyof typeof AxisPositionY]

export const AXIS_POSITION_Y_OPTIONS: { value: AxisPositionY; label: string }[] = [
  { value: AxisPositionY.LEFT, label: "Left" },
  { value: AxisPositionY.RIGHT, label: "Right" },
]

export const ChartLineType = {
  LINE: "LINE",
  BAR: "BAR",
} as const
export type ChartLineType = (typeof ChartLineType)[keyof typeof ChartLineType]

export const CHART_LINE_TYPE_OPTIONS: { value: ChartLineType; label: string }[] = [
  { value: ChartLineType.LINE, label: "Line" },
  { value: ChartLineType.BAR, label: "Bar" },
]

export const PointStyle = {
  CIRCLE: "CIRCLE",
  CROSS: "CROSS",
  CROSS_ROT: "CROSS_ROT",
  DASH: "DASH",
  LINE: "LINE",
  RECT: "RECT",
  RECT_ROUNDED: "RECT_ROUNDED",
  RECT_ROT: "RECT_ROT",
  STAR: "STAR",
  TRIANGLE: "TRIANGLE",
} as const
export type PointStyle = (typeof PointStyle)[keyof typeof PointStyle]

export const POINT_STYLE_OPTIONS: { value: PointStyle; label: string }[] = [
  { value: PointStyle.CIRCLE, label: "Circle" },
  { value: PointStyle.CROSS, label: "Cross" },
  { value: PointStyle.CROSS_ROT, label: "Cross (rot)" },
  { value: PointStyle.DASH, label: "Dash" },
  { value: PointStyle.LINE, label: "Line" },
  { value: PointStyle.RECT, label: "Rect" },
  { value: PointStyle.RECT_ROUNDED, label: "Rect (rounded)" },
  { value: PointStyle.RECT_ROT, label: "Rect (rotated)" },
  { value: PointStyle.STAR, label: "Star" },
  { value: PointStyle.TRIANGLE, label: "Triangle" },
]

export const ObjectivesLineType = {
  SOLID: "SOLID",
  DASHED: "DASHED",
} as const
export type ObjectivesLineType = (typeof ObjectivesLineType)[keyof typeof ObjectivesLineType]

export const OBJECTIVES_LINE_TYPE_OPTIONS: { value: ObjectivesLineType; label: string }[] = [
  { value: ObjectivesLineType.SOLID, label: "Solid" },
  { value: ObjectivesLineType.DASHED, label: "Dashed" },
]

export interface ChartXAxisConfig {
  title: string
  position: AxisPositionX
  hideGrid: boolean
}

export interface ChartYAxisConfig {
  title: string
  position: AxisPositionY
  hideGrid: boolean
  suggestedMin?: number
  suggestedMax?: number
}

export interface ChartDatasetVisualConfig {
  title: string
  axis: string
  type: ChartLineType
  pointStyle?: PointStyle
  borderColor: string
  backgroundColor: string
  trendlineColor: string
  spanGaps: boolean
  showValues: boolean
  unpin?: boolean
  stacked?: boolean
}

export interface ChartObjectivesVisualConfig {
  showLabel: boolean
  fontColor: string
  showLine: boolean
  borderColor: string
  lineType: ObjectivesLineType
  showBackground: boolean
  backgroundColor: string
}

export interface ChartConfig {
  datasets: string[]
  interval: ChartInterval
  xAxis: ChartXAxisConfig
  yAxis: ChartYAxisConfig
  datasetConfigs?: Record<string, ChartDatasetVisualConfig>
  objectives?: ChartObjectivesVisualConfig
}

const DATASET_NAME_PRESETS: Record<string, Partial<ChartDatasetVisualConfig>> = {
  [normalizeDatasetName(KNOWN_DATASET_NAMES.BASELINE)]: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
    unpin: false,
  },
  [normalizeDatasetName(KNOWN_DATASET_NAMES.TOTAL)]: {
    borderColor: "#0F172A",
    backgroundColor: "#0F172A",
  },
}

export function createDefaultDatasetVisualConfig(
  datasetName: string,
  yAxisTitle: string = ""
): ChartDatasetVisualConfig {
  const preset = DATASET_NAME_PRESETS[normalizeDatasetName(datasetName)] ?? {}
  const base: ChartDatasetVisualConfig = {
    title: datasetName,
    axis: yAxisTitle,
    type: ChartLineType.LINE,
    pointStyle: PointStyle.CIRCLE,
    borderColor: "#037ECC",
    backgroundColor: "#037ECC",
    trendlineColor: "#00000000",
    spanGaps: false,
    showValues: false,
  }

  if (isBaselineDataset(datasetName)) base.unpin = false
  if (isStackedDataset(datasetName)) base.stacked = false

  return { ...base, ...preset }
}

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  datasets: [],
  interval: ChartInterval.WEEKLY,
  xAxis: {
    title: "Dates",
    position: AxisPositionX.BOTTOM,
    hideGrid: false,
  },
  yAxis: {
    title: "Number of occurrences",
    position: AxisPositionY.LEFT,
    hideGrid: false,
    suggestedMin: 0,
    suggestedMax: 20,
  },
  datasetConfigs: {},
  objectives: {
    showLabel: true,
    fontColor: "#0F172A",
    showLine: true,
    borderColor: "#0F172A",
    lineType: ObjectivesLineType.DASHED,
    showBackground: false,
    backgroundColor: "#00000000",
  },
}
