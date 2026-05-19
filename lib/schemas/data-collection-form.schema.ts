import { z } from "zod"

export const dataCollectionLevelSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  description: z.string().min(1, "Description is required"),
  value: z.boolean().optional(),
})

export const dataCollectionFormSchema = z.object({
  type: z.string().min(1, "Type is required"),
  weeklyDailyValue: z.string().optional(),
  dailyValue: z.string().optional(),
  intervalLength: z.coerce.number().positive("Must be positive").optional(),
  unitOfTime: z.string().optional(),
  suggestedNumberOfRecordings: z.coerce.number().int("Must be an integer").positive("Must be positive").optional(),
  cumulative: z.boolean().optional(),
  levels: z.array(dataCollectionLevelSchema),
  // Item-only fields
  topography: z.string().optional(),
  active: z.boolean().optional(),
})

export type DataCollectionFormValues = z.infer<typeof dataCollectionFormSchema>
