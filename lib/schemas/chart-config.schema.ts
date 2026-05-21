import { z } from "zod"

import {
  AxisPositionX,
  AxisPositionY,
  ChartInterval,
  ChartLineType,
  ObjectivesLineType,
  PointStyle,
} from "@/lib/modules/service-plans/constants/chart.constants"

const xAxisSchema = z.object({
  title: z.string(),
  position: z.nativeEnum(AxisPositionX),
  hideGrid: z.boolean(),
})

const yAxisSchema = z.object({
  title: z.string(),
  position: z.nativeEnum(AxisPositionY),
  hideGrid: z.boolean(),
  suggestedMin: z.coerce.number().optional(),
  suggestedMax: z.coerce.number().optional(),
})

const datasetVisualSchema = z.object({
  title: z.string(),
  axis: z.string(),
  type: z.nativeEnum(ChartLineType),
  pointStyle: z.nativeEnum(PointStyle).optional(),
  borderColor: z.string(),
  backgroundColor: z.string(),
  trendlineColor: z.string(),
  spanGaps: z.boolean(),
  showValues: z.boolean(),
  unpin: z.boolean().optional(),
  stacked: z.boolean().optional(),
})

const objectivesVisualSchema = z.object({
  showLabel: z.boolean(),
  fontColor: z.string(),
  showLine: z.boolean(),
  borderColor: z.string(),
  lineType: z.nativeEnum(ObjectivesLineType),
  showBackground: z.boolean(),
  backgroundColor: z.string(),
})

export const chartConfigSchema = z.object({
  datasets: z.array(z.string()),
  interval: z.nativeEnum(ChartInterval),
  xAxis: xAxisSchema,
  yAxis: yAxisSchema,
  datasetConfigs: z.record(z.string(), datasetVisualSchema).optional(),
  objectives: objectivesVisualSchema.optional(),
})

export type ChartConfigFormValues = z.infer<typeof chartConfigSchema>
