export const CHART_STATIC_TABS = {
  GENERAL: "general",
  X_AXIS: "x-axis",
  Y_AXES: "y-axes",
} as const

export const CHART_DATASET_TAB_PREFIX = "dataset:"

export function chartDatasetTabId(datasetId: string): string {
  return `${CHART_DATASET_TAB_PREFIX}${datasetId}`
}

const CHART_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  axis: "Axis",
  type: "Line type",
  pointStyle: "Point style",
  borderColor: "Border color",
  backgroundColor: "Background color",
  trendlineColor: "Trendline color",
  interval: "Interval",
  datasets: "Datasets",
  position: "Position",
  hideGrid: "Hide grid",
  suggestedMin: "Suggested min",
  suggestedMax: "Suggested max",
  showLabel: "Show label",
  fontColor: "Font color",
  showLine: "Show line",
  lineType: "Line type",
  showBackground: "Show background",
}

const CHART_SECTION_LABELS: Record<string, string> = {
  xAxis: "X axis",
  yAxis: "Y axis",
  objectives: "Objectives",
  datasetConfigs: "Dataset",
}

function hasNestedErrors(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  if ("message" in value && typeof (value as { message?: unknown }).message === "string") {
    return true
  }
  return Object.values(value as Record<string, unknown>).some(hasNestedErrors)
}

export function getChartTabsWithErrors(
  chartErrors: Record<string, unknown> | undefined,
  options?: {
    objectivesDatasetId?: string
    selectedDatasetIds?: string[]
  }
): Set<string> {
  const tabs = new Set<string>()
  if (!chartErrors) return tabs

  if (hasNestedErrors(chartErrors.yAxis)) tabs.add(CHART_STATIC_TABS.Y_AXES)
  if (hasNestedErrors(chartErrors.xAxis)) tabs.add(CHART_STATIC_TABS.X_AXIS)
  if (hasNestedErrors(chartErrors.interval) || hasNestedErrors(chartErrors.datasets)) {
    tabs.add(CHART_STATIC_TABS.GENERAL)
  }

  if (hasNestedErrors(chartErrors.objectives) && options?.objectivesDatasetId) {
    tabs.add(chartDatasetTabId(options.objectivesDatasetId))
  }

  const configs = chartErrors.datasetConfigs as Record<string, unknown> | undefined
  if (configs) {
    for (const datasetId of Object.keys(configs)) {
      if (hasNestedErrors(configs[datasetId])) {
        tabs.add(chartDatasetTabId(datasetId))
      }
    }
  }

  return tabs
}

export function getFirstChartErrorTab(
  chartErrors: Record<string, unknown> | undefined,
  options?: {
    objectivesDatasetId?: string
    selectedDatasetIds?: string[]
  }
): string {
  if (!chartErrors) return CHART_STATIC_TABS.GENERAL

  if (hasNestedErrors(chartErrors.yAxis)) return CHART_STATIC_TABS.Y_AXES
  if (hasNestedErrors(chartErrors.xAxis)) return CHART_STATIC_TABS.X_AXIS

  if (hasNestedErrors(chartErrors.objectives) && options?.objectivesDatasetId) {
    return chartDatasetTabId(options.objectivesDatasetId)
  }

  const configs = chartErrors.datasetConfigs as Record<string, unknown> | undefined
  if (configs) {
    const orderedIds = options?.selectedDatasetIds ?? Object.keys(configs)
    for (const datasetId of orderedIds) {
      if (hasNestedErrors(configs[datasetId])) {
        return chartDatasetTabId(datasetId)
      }
    }
  }

  if (hasNestedErrors(chartErrors.interval) || hasNestedErrors(chartErrors.datasets)) {
    return CHART_STATIC_TABS.GENERAL
  }

  return CHART_STATIC_TABS.GENERAL
}

function resolvePathLabel(
  path: string[],
  datasetLabels?: Record<string, string>
): string {
  if (path.length === 0) return "Chart"

  const [head, ...rest] = path

  if (head === "datasetConfigs" && rest[0]) {
    const datasetId = rest[0]
    const datasetName = datasetLabels?.[datasetId]
    const fieldKey = rest[1]
    const fieldLabel = fieldKey ? (CHART_FIELD_LABELS[fieldKey] ?? fieldKey) : ""
    const prefix = datasetName ?? "Dataset"
    return fieldLabel ? `${prefix} — ${fieldLabel}` : prefix
  }

  const section = CHART_SECTION_LABELS[head] ?? head
  const fieldKey = rest[0]
  if (!fieldKey) return section

  const fieldLabel = CHART_FIELD_LABELS[fieldKey] ?? fieldKey
  return `${section} — ${fieldLabel}`
}

export function collectChartErrorMessages(
  chartErrors: Record<string, unknown> | undefined,
  datasetLabels?: Record<string, string>,
  path: string[] = []
): string[] {
  if (!chartErrors) return []

  const messages: string[] = []

  for (const [key, value] of Object.entries(chartErrors)) {
    if (!value) continue

    const nextPath = [...path, key]

    if (typeof value === "object" && "message" in value && typeof value.message === "string") {
      const context = resolvePathLabel(nextPath.slice(0, -1), datasetLabels)
      const fieldLabel = CHART_FIELD_LABELS[key] ?? key
      const message = value.message === "Required" ? `${fieldLabel} is required` : value.message
      messages.push(context ? `${context}: ${message}` : message)
      continue
    }

    if (typeof value === "object") {
      if (key === "datasetConfigs") {
        const configs = value as Record<string, unknown>
        for (const [datasetId, configErrors] of Object.entries(configs)) {
          messages.push(
            ...collectChartErrorMessages(
              configErrors as Record<string, unknown>,
              datasetLabels,
              [...path, key, datasetId]
            )
          )
        }
        continue
      }

      messages.push(
        ...collectChartErrorMessages(
          value as Record<string, unknown>,
          datasetLabels,
          nextPath
        )
      )
    }
  }

  return messages
}
