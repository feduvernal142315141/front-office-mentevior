import { z } from "zod"

const diagnosisCodeRegex = /^[A-Za-z0-9\s\-_/().,:#&+]+$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

const requiredIsoDate = (label: string) => z.string()
  .min(1, `${label} is required`)
  .regex(isoDateRegex, `${label} is invalid`)

export const diagnosisFormSchema = z.object({
  code: z.string()
    .trim()
    .min(1, "Code is required")
    .max(120, "Code must be at most 120 characters")
    .regex(/[A-Za-z0-9]/, "Code must include at least one letter or number")
    .regex(diagnosisCodeRegex, "Code contains invalid characters"),
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(160, "Name must be at most 160 characters"),
  referralDate: requiredIsoDate("Referral date"),
  treatmentStartDate: requiredIsoDate("Treatment start date"),
  status: z.boolean(),
  treatmentEndDate: z.string()
    .regex(isoDateRegex, "Treatment end date is invalid")
    .optional()
    .or(z.literal("")),
  isPrimary: z.boolean(),
}).superRefine((values, ctx) => {
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
  code: "",
  name: "",
  referralDate: "",
  treatmentStartDate: "",
  status: true,
  treatmentEndDate: "",
  isPrimary: true,
}
