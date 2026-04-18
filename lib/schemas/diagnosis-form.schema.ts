import { z } from "zod"

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

const requiredIsoDate = (label: string) => z.string()
  .min(1, `${label} is required`)
  .regex(isoDateRegex, `${label} is invalid`)

export const diagnosisFormSchema = z.object({
  /** ICD catalog row id — sent on create/update; code/name are display only */
  diagnosisCodeId: z.string().min(1, "Select a diagnosis from the catalog"),
  code: z.string().max(120, "Code must be at most 120 characters"),
  name: z.string().max(160, "Name must be at most 160 characters"),
  referralDate: requiredIsoDate("Referral date"),
  treatmentStartDate: requiredIsoDate("Treatment start date"),
  status: z.boolean(),
  treatmentEndDate: z.string()
    .regex(isoDateRegex, "Treatment end date is invalid")
    .optional()
    .or(z.literal("")),
  isPrimary: z.boolean(),
}).superRefine((values, ctx) => {
  if (values.treatmentStartDate < values.referralDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["treatmentStartDate"],
      message: "Treatment start date must be on or after referral date",
    })
  }

  if (!values.treatmentEndDate) {
    return
  }

  if (values.treatmentEndDate < values.treatmentStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["treatmentEndDate"],
      message: "Treatment end date must be after treatment start date",
    })
  }
})

export type DiagnosisFormValues = z.infer<typeof diagnosisFormSchema>

export const diagnosisFormDefaults: DiagnosisFormValues = {
  diagnosisCodeId: "",
  code: "",
  name: "",
  referralDate: "",
  treatmentStartDate: "",
  status: true,
  treatmentEndDate: "",
  isPrimary: true,
}
