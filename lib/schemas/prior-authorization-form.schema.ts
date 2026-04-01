import { z } from "zod"
import type { DurationInterval, UnitsInterval } from "@/lib/types/prior-authorization.types"

export const DURATION_INTERVALS: DurationInterval[] = ["DAYS", "WEEKS", "MONTHS"]
export const UNITS_INTERVALS: UnitsInterval[] = ["UNIT", "EVENT"]

export const DURATION_INTERVAL_OPTIONS = [
  { value: "DAYS" as DurationInterval,   label: "Days" },
  { value: "WEEKS" as DurationInterval,  label: "Weeks" },
  { value: "MONTHS" as DurationInterval, label: "Months" },
]

export const UNITS_INTERVAL_OPTIONS = [
  { value: "UNIT" as UnitsInterval,  label: "Unit" },
  { value: "EVENT" as UnitsInterval, label: "Event" },
]

export const priorAuthFormSchema = z
  .object({
    authNumber: z
      .string()
      .min(1, "Authorization number is required")
      .regex(/^\d+$/, "Authorization number must be numeric"),
    insuranceId: z.string().min(1, "Insurance is required"),
    primaryDiagnosisId: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    durationInterval: z.enum(["DAYS", "WEEKS", "MONTHS"]),
    requestDate: z.string().optional(),
    responseDate: z.string().optional(),
    comments: z
      .string()
      .max(500, "Comments cannot exceed 500 characters")
      .optional(),
    attachment: z.string().optional(),
    attachmentName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true
      return data.endDate >= data.startDate
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  )

export type PriorAuthFormValues = z.infer<typeof priorAuthFormSchema>

export const priorAuthFormDefaults: PriorAuthFormValues = {
  authNumber: "",
  insuranceId: "",
  primaryDiagnosisId: "",
  startDate: "",
  endDate: "",
  durationInterval: "WEEKS",
  requestDate: "",
  responseDate: "",
  comments: "",
  attachment: "",
  attachmentName: "",
}

export const billingCodeEntrySchema = z.object({
  billingCodeId: z.string().min(1, "Billing code is required"),
  approvedUnits: z
    .number({ invalid_type_error: "Must be a number" })
    .positive("Approved units must be greater than 0"),
  usedUnits: z.number().min(0).default(0),
  unitsInterval: z.enum(["UNIT", "EVENT"]),
  maxUnitsPerDay:   z.number().positive().nullable().optional(),
  maxUnitsPerWeek:  z.number().positive().nullable().optional(),
  maxUnitsPerMonth: z.number().positive().nullable().optional(),
  maxCountPerDay:   z.number().positive().nullable().optional(),
  maxCountPerWeek:  z.number().positive().nullable().optional(),
  maxCountPerMonth: z.number().positive().nullable().optional(),
})

export type BillingCodeEntryValues = z.infer<typeof billingCodeEntrySchema>

export const billingCodeEntryDefaults: BillingCodeEntryValues = {
  billingCodeId: "",
  approvedUnits: 1,
  usedUnits: 0,
  unitsInterval: "UNIT",
  maxUnitsPerDay: null,
  maxUnitsPerWeek: null,
  maxUnitsPerMonth: null,
  maxCountPerDay: null,
  maxCountPerWeek: null,
  maxCountPerMonth: null,
}
