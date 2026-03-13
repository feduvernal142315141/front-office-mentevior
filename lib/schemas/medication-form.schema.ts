import { z } from "zod"

const alphanumericWithSpacesRegex = /^[a-zA-Z0-9 ]+$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

export const medicationFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters")
    .regex(alphanumericWithSpacesRegex, "Name must be alphanumeric"),

  dosage: z.string()
    .trim()
    .max(120, "Dosage must be at most 120 characters")
    .regex(alphanumericWithSpacesRegex, "Dosage must be alphanumeric")
    .optional()
    .or(z.literal("")),

  prescriptionDate: z.string()
    .regex(isoDateRegex, "Prescription date is invalid")
    .optional()
    .or(z.literal("")),

  treatmentStartDate: z.string()
    .regex(isoDateRegex, "Treatment start date is invalid")
    .optional()
    .or(z.literal("")),

  comments: z.string()
    .trim()
    .max(500, "Comments must be at most 500 characters")
    .optional()
    .or(z.literal("")),
}).superRefine((values, ctx) => {
  if (!values.prescriptionDate || !values.treatmentStartDate) {
    return
  }

  if (values.treatmentStartDate < values.prescriptionDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["treatmentStartDate"],
      message: "Treatment start date cannot be earlier than prescription date",
    })
  }
})

export type MedicationFormValues = z.infer<typeof medicationFormSchema>

export const medicationFormDefaults: MedicationFormValues = {
  name: "",
  dosage: "",
  prescriptionDate: "",
  treatmentStartDate: "",
  comments: "",
}
