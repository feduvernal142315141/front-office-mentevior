import { z } from "zod"

import {
  AxisPositionX,
  AxisPositionY,
  ChartInterval,
  ChartLineType,
  ObjectivesLineType,
  PointStyle,
} from "@/lib/modules/service-plans/constants/chart.constants"

function optionalEnum<T extends Record<string, string>>(enumObject: T) {
  return z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.nativeEnum(enumObject).optional()
  )
}

const xAxisSchema = z.object({
  title: z.string().min(1, "Title is required"),
  position: z.nativeEnum(AxisPositionX),
  hideGrid: z.boolean(),
})

const yAxisSchema = z.object({
  title: z.string().min(1, "Title is required"),
  position: z.nativeEnum(AxisPositionY),
  hideGrid: z.boolean(),
  suggestedMin: z.coerce.number().optional(),
  suggestedMax: z.coerce.number().optional(),
})

const datasetVisualSchema = z.object({
  title: z.string().min(1, "Title is required"),
  axis: z.string().min(1, "Select a Y axis title first"),
  type: z.nativeEnum(ChartLineType, { message: "Line type is required" }),
  pointStyle: optionalEnum(PointStyle),
  borderColor: z.string().min(1, "Border color is required"),
  backgroundColor: z.string().min(1, "Background color is required"),
  trendlineColor: z.string().min(1, "Trendline color is required"),
  spanGaps: z.boolean(),
  showValues: z.boolean(),
  unpin: z.boolean().optional(),
  stacked: z.boolean().optional(),
})

const objectivesVisualSchema = z.object({
  showLabel: z.boolean(),
  fontColor: z.string().min(1, "Font color is required"),
  showLine: z.boolean(),
  borderColor: z.string().min(1, "Border color is required"),
  lineType: z.nativeEnum(ObjectivesLineType),
  showBackground: z.boolean(),
  backgroundColor: z.string().min(1, "Background color is required"),
})

const chartConfigBaseSchema = z.object({
  datasets: z.array(z.string()),
  interval: z.nativeEnum(ChartInterval),
  xAxis: xAxisSchema,
  yAxis: yAxisSchema,
  datasetConfigs: z.record(z.string(), datasetVisualSchema).optional(),
  objectives: objectivesVisualSchema.optional(),
})

export const chartConfigSchema = chartConfigBaseSchema.superRefine((data, ctx) => {
  for (const datasetId of data.datasets) {
    if (!data.datasetConfigs?.[datasetId]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dataset configuration is required",
        path: ["datasetConfigs", datasetId],
      })
    }
  }
})

export type ChartConfigFormValues = z.infer<typeof chartConfigSchema>
