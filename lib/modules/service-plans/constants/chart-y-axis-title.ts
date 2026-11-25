import { DEFAULT_CHART_CONFIG, normalizeAxisTitle } from "@/lib/modules/service-plans/constants/chart.constants"
import { typeIsFrequency, typeRequiresDailyAndWeekly } from "@/lib/modules/service-plans/constants/data-collection.constants"

/**
 * Qué mide la gráfica de un item según su Type. Define el título del eje Y: el valor del chart
 * depende del tipo elegido, no siempre del conteo de ocurrencias.
 */
export type ChartValueKind = "frequency" | "percentage" | "duration" | "rate" | "other"

const PERCENTAGE_TYPE_NAMES = new Set([
  "percentage of opportunities",
  "partial interval",
  "whole interval",
  "momentary time sampling",
])

export function resolveChartValueKind(typeName: string | null | undefined): ChartValueKind {
  const name = (typeName ?? "").trim().toLowerCase()
  if (!name) return "other"
  if (typeIsFrequency(name)) return "frequency"
  if (PERCENTAGE_TYPE_NAMES.has(name)) return "percentage"
  if (typeRequiresDailyAndWeekly(name)) return "duration"
  if (name === "rate") return "rate"
  return "other"
}

/** Un título guardado distinto del genérico por defecto es una elección del usuario y se respeta */
function isCustomTitle(configTitle: string | null | undefined): configTitle is string {
  const title = (configTitle ?? "").trim()
  return title !== "" && normalizeAxisTitle(title) !== DEFAULT_CHART_CONFIG.yAxis.title
}

/**
 * Título del eje Y de la gráfica de un item.
 *
 * Todos los items guardan "Number of occurrences" como título al crearse (valor por defecto del
 * formulario), así que ese texto genérico no puede ganarle al tipo: solo cuenta como título
 * propio un título distinto de ese.
 *
 * @param unitLabel unidad de tiempo del item ("Seconds", "Minutes"…), si se conoce
 */
export function resolveChartYAxisTitle(
  kind: ChartValueKind,
  configTitle?: string | null,
  unitLabel?: string,
): string {
  if (isCustomTitle(configTitle)) return configTitle.trim()
  switch (kind) {
    case "percentage":
      return "Percentage (%)"
    case "duration":
      return unitLabel ? `Values (${unitLabel})` : "Values"
    case "rate":
      return unitLabel ? `Rate (occ/${unitLabel})` : "Rate"
    default:
      return DEFAULT_CHART_CONFIG.yAxis.title
  }
}
