import { z } from "zod"

import {
  typeRequiresDailyAndWeekly,
  typeRequiresInterval,
  typeRequiresUnitOfTime,
  typeRequiresWeeklyDaily,
  typeIsMeasurementLog,
} from "@/lib/modules/service-plans/constants/data-collection.constants"
import {
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import {
  normalizeChartConfigForValidation,
  type ChartConfig,
} from "@/lib/modules/service-plans/constants/chart.constants"
import { chartConfigSchema } from "@/lib/schemas/chart-config.schema"
import { collectChartErrorMessages } from "@/lib/schemas/chart-form-errors"

export const dataCollectionLevelSchema = z.object({
  id: z.string(),
  recordId: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  description: z.string().min(1, "Description is required"),
  value: z.boolean().optional(),
})

export type ResolvedTypeInfo = { name: string; group: string }

export type DataCollectionFormMode = "category" | "item"

export function createDataCollectionFormSchema(
  mode: DataCollectionFormMode,
  resolveType: (typeId: string) => ResolvedTypeInfo,
  resolveDatasetName: (datasetId: string) => string = () => "Dataset"
) {
  return z
    .object({
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
      topography: z.string().optional(),
      active: z.boolean().optional(),
      chart: z.preprocess((value) => {
        if (!value || typeof value !== "object") return value
        return normalizeChartConfigForValidation(value as ChartConfig, resolveDatasetName)
      }, chartConfigSchema.optional()),
    })
    .superRefine((data, ctx) => {
      const { name, group } = resolveType(data.type)

      if (mode === "item" && !data.topography?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Topography is required",
          path: ["topography"],
        })
      }

      if (typeIsMeasurementLog(name)) {
        if (!data.unitMeasurementCatalogId?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Unit of measurement is required",
            path: ["unitMeasurementCatalogId"],
          })
        }
        if (!data.dailyValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Daily value is required",
            path: ["dailyValue"],
          })
        }
        if (!data.weeklyDailyValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Weekly value is required",
            path: ["weeklyDailyValue"],
          })
        }
      }

      if (typeRequiresWeeklyDaily(name) && !typeRequiresUnitOfTime(name)) {
        if (!data.weeklyDailyValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Weekly / Daily value is required",
            path: ["weeklyDailyValue"],
          })
        }
      }

      if (typeRequiresUnitOfTime(name)) {
        if (!data.unitOfTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Unit of time is required",
            path: ["unitOfTime"],
          })
        }
        if (!data.weeklyDailyValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Weekly value is required",
            path: ["weeklyDailyValue"],
          })
        }
      }

      if (typeRequiresDailyAndWeekly(name)) {
        if (!data.unitOfTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Unit of time is required",
            path: ["unitOfTime"],
          })
        }
        if (data.suggestedNumberOfRecordings === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Suggested number of recordings is required",
            path: ["suggestedNumberOfRecordings"],
          })
        }
        if (!data.dailyValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Daily value is required",
            path: ["dailyValue"],
          })
        }
        if (!data.weeklyDailyValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Weekly value is required",
            path: ["weeklyDailyValue"],
          })
        }
      }

      if (typeRequiresInterval(group)) {
        if (data.intervalLength === undefined || data.intervalLength <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Interval length is required",
            path: ["intervalLength"],
          })
        }
        if (!data.unitOfTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Unit of time is required",
            path: ["unitOfTime"],
          })
        }
        if (data.suggestedNumberOfRecordings === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Suggested number of recordings is required",
            path: ["suggestedNumberOfRecordings"],
          })
        }
      }
    })
}

export type DataCollectionFormValues = z.infer<
  ReturnType<typeof createDataCollectionFormSchema>
>

const DATA_COLLECTION_FIELD_KEYS = [
  "type",
  "weeklyDailyValue",
  "dailyValue",
  "unitMeasurementCatalogId",
  "intervalLength",
  "unitOfTime",
  "suggestedNumberOfRecordings",
  "levels",
  "cumulative",
] as const

export function hasDataCollectionSectionErrors(
  errors: Partial<Record<string, unknown>>
): boolean {
  return DATA_COLLECTION_FIELD_KEYS.some((key) => Boolean(errors[key]))
}

export function hasChartSectionErrors(errors: Partial<Record<string, unknown>>): boolean {
  return Boolean(errors.chart)
}

const FORM_FIELD_LABELS: Record<string, string> = {
  type: "Type",
  weeklyDailyValue: "Weekly value",
  dailyValue: "Daily value",
  unitMeasurementCatalogId: "Unit of measurement",
  intervalLength: "Interval length",
  unitOfTime: "Unit of time",
  suggestedNumberOfRecordings: "Suggested number of recordings",
  levels: "Levels",
  topography: "Topography",
  chart: "Chart",
}

function collectFormErrorMessages(
  errors: Partial<Record<string, unknown>>,
  path: string[] = []
): string[] {
  const messages: string[] = []

  for (const [key, value] of Object.entries(errors)) {
    if (!value || key === "chart") continue

    const nextPath = [...path, key]

    if (typeof value === "object" && "message" in value && typeof value.message === "string") {
      const label = FORM_FIELD_LABELS[key] ?? key
      const message =
        value.message === "Required" ? `${label} is required` : value.message
      const prefix =
        path.length > 0
          ? `${FORM_FIELD_LABELS[path[path.length - 1]] ?? path[path.length - 1]}: `
          : ""
      messages.push(`${prefix}${message}`)
      continue
    }

    if (typeof value === "object") {
      messages.push(...collectFormErrorMessages(value as Partial<Record<string, unknown>>, nextPath))
    }
  }

  return messages
}

export function getFirstFormErrorMessage(
  errors: Partial<Record<string, unknown>>
): string {
  const collected = collectFormErrorMessages(errors)
  if (collected.length > 0) return collected[0]
  return "Please fix the highlighted fields before saving"
}

export function formatDataCollectionValidationAlert(
  errors: Partial<Record<string, unknown>>,
  options?: { datasetLabels?: Record<string, string> }
): { title: string; description: string } {
  const collected = [
    ...collectFormErrorMessages(errors),
    ...collectChartErrorMessages(
      errors.chart as Record<string, unknown> | undefined,
      options?.datasetLabels
    ),
  ]

  if (collected.length === 0) {
    return {
      title: "Complete required fields",
      description: "Please fix the highlighted fields before saving.",
    }
  }

  const preview = collected.slice(0, 3).join(" • ")
  const remainder = collected.length > 3 ? ` (+${collected.length - 3} more)` : ""

  return {
    title: "Complete required fields",
    description: `${preview}${remainder}`,
  }
}
