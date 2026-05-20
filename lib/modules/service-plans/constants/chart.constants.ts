// Chart configuration — premium UI inside the Data Collection drawer.
// No backend contract yet → values are persisted only in form state.

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

export const ChartDataset = {
  BASELINE: "BASELINE",
  AVERAGE: "AVERAGE",
  TOTAL: "TOTAL",
  LEVELS_AVERAGE: "LEVELS_AVERAGE",
  LEVELS_TOTAL: "LEVELS_TOTAL",
  OBJECTIVES: "OBJECTIVES",
  INTENSITY: "INTENSITY",
  RATE: "RATE",
  TAGS: "TAGS",
  NUMBER_OF_TAGS: "NUMBER_OF_TAGS",
  SESSIONS_COUNT: "SESSIONS_COUNT",
  RECORDINGS: "RECORDINGS",
  COUNT: "COUNT",
} as const
export type ChartDataset = (typeof ChartDataset)[keyof typeof ChartDataset]

export interface ChartDatasetOption {
  value: ChartDataset
  label: string
  description: string
}

export const CHART_DATASET_OPTIONS: ChartDatasetOption[] = [
  { value: ChartDataset.BASELINE, label: "Baseline", description: "All collected baselines marked as visible." },
  { value: ChartDataset.AVERAGE, label: "Average", description: "Average of all per session values for interval." },
  { value: ChartDataset.TOTAL, label: "Total", description: "Sum of all per session values for interval." },
  { value: ChartDataset.LEVELS_AVERAGE, label: "Levels (Average)", description: "Average per level for interval." },
  { value: ChartDataset.LEVELS_TOTAL, label: "Levels (Total)", description: "Sum per level for interval." },
  { value: ChartDataset.OBJECTIVES, label: "Objectives", description: "Phase lines for defined objectives." },
  { value: ChartDataset.INTENSITY, label: "Intensity", description: "Intensity (average of levels values) for interval." },
  { value: ChartDataset.RATE, label: "Rate", description: "Average of rate for interval." },
  { value: ChartDataset.TAGS, label: "Tags", description: "Division by tags per interval." },
  { value: ChartDataset.NUMBER_OF_TAGS, label: "# of Tags", description: "Number of unique tags used for interval." },
  { value: ChartDataset.SESSIONS_COUNT, label: "Sessions (count)", description: "# of individual sessions for interval (Ex: 1 visit = 1 session)." },
  { value: ChartDataset.RECORDINGS, label: "Recordings", description: "# of recordings for interval (Ex: 1 trial = 1 recording)." },
  { value: ChartDataset.COUNT, label: "Count", description: "Sum of all session values for entire period." },
]

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
  CIRCLE: "circle",
  CROSS: "cross",
  CROSS_ROT: "crossRot",
  DASH: "dash",
  LINE: "line",
  RECT: "rect",
  RECT_ROUNDED: "rectRounded",
  RECT_ROT: "rectRot",
  STAR: "star",
  TRIANGLE: "triangle",
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

export interface ChartYAxis {
  id: string
  title: string
  position: AxisPositionY
  hideGrid: boolean
  suggestedMin?: number
  suggestedMax?: number
}

export interface ChartDatasetVisualConfig {
  title: string
  axisId: string
  type: ChartLineType
  pointStyle?: PointStyle
  borderColor: string
  backgroundColor: string
  trendlineColor: string
  spanGaps: boolean
  showValues: boolean
  unpin?: boolean
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
  datasets: ChartDataset[]
  interval: ChartInterval
  xAxis: {
    title: string
    position: AxisPositionX
    hideGrid: boolean
  }
  yAxes: ChartYAxis[]
  baseline?: ChartDatasetVisualConfig
  total?: ChartDatasetVisualConfig
  objectives?: ChartObjectivesVisualConfig
}

export const DEFAULT_Y_AXIS_ID = "y-axis-default"

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  datasets: [ChartDataset.BASELINE, ChartDataset.TOTAL, ChartDataset.OBJECTIVES],
  interval: ChartInterval.WEEKLY,
  xAxis: {
    title: "Dates",
    position: AxisPositionX.BOTTOM,
    hideGrid: false,
  },
  yAxes: [
    {
      id: DEFAULT_Y_AXIS_ID,
      title: "Number of occurrences",
      position: AxisPositionY.LEFT,
      hideGrid: false,
      suggestedMin: 0,
      suggestedMax: 20,
    },
  ],
  baseline: {
    title: "Baseline",
    axisId: DEFAULT_Y_AXIS_ID,
    type: ChartLineType.LINE,
    pointStyle: PointStyle.CIRCLE,
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
    trendlineColor: "#00000000",
    spanGaps: false,
    showValues: false,
    unpin: false,
  },
  total: {
    title: "Total",
    axisId: DEFAULT_Y_AXIS_ID,
    type: ChartLineType.LINE,
    pointStyle: PointStyle.CIRCLE,
    borderColor: "#0F172A",
    backgroundColor: "#0F172A",
    trendlineColor: "#00000000",
    spanGaps: false,
    showValues: false,
  },
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
