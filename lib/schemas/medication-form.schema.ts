import { z } from "zod"

const alphanumericWithSpacesRegex = /^[a-zA-Z0-9 ]+$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

const requiredAlphanumeric = (label: string, maxLength: number) => z.string()
  .trim()
  .min(1, `${label} is required`)
  .max(maxLength, `${label} must be at most ${maxLength} characters`)
  .regex(alphanumericWithSpacesRegex, `${label} must be alphanumeric`)

const requiredIsoDate = (label: string) => z.string()
  .min(1, `${label} is required`)
  .regex(isoDateRegex, `${label} is invalid`)

export const medicationFormSchema = z.object({
  name: requiredAlphanumeric("Name", 120),
  dosage: requiredAlphanumeric("Dosage", 120),
  prescriptionDate: requiredIsoDate("Prescription date"),
  treatmentStartDate: requiredIsoDate("Treatment start date"),
  comments: requiredAlphanumeric("Comments", 500),
})

export type MedicationFormValues = z.infer<typeof medicationFormSchema>

export const medicationFormDefaults: MedicationFormValues = {
  name: "",
  dosage: "",
  prescriptionDate: "",
  treatmentStartDate: "",
  comments: "",
}
