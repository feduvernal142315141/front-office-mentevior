import { z } from "zod"

import {
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import { chartConfigSchema } from "@/lib/schemas/chart-config.schema"

export const dataCollectionLevelSchema = z.object({
  id: z.string(),
  recordId: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  description: z.string().min(1, "Description is required"),
  value: z.boolean().optional(),
})

export const dataCollectionFormSchema = z.object({
  type: z.string().min(1, "Type is required"),
  weeklyDailyValue: z.nativeEnum(ServicePlanValueType).optional(),
  dailyValue: z.nativeEnum(ServicePlanValueType).optional(),
  unitMeasurementCatalogId: z.string().optional(),
  intervalLength: z.coerce.number().positive("Must be positive").optional(),
  unitOfTime: z.nativeEnum(ServicePlanUnitOfTime).optional(),
  suggestedNumberOfRecordings: z.coerce
    .number()
    .int("Must be an integer")
    .positive("Must be positive")
    .optional(),
  cumulative: z.boolean().optional(),
  levels: z.array(dataCollectionLevelSchema),
  // Item-only fields
  topography: z.string().optional(),
  active: z.boolean().optional(),
  // Chart visualization config (UI-only, no backend contract yet)
  chart: chartConfigSchema.optional(),
})

export type DataCollectionFormValues = z.infer<typeof dataCollectionFormSchema>
