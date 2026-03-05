import { z } from "zod"
import { caregiverRelationshipOptions } from "@/lib/types/caregiver.types"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const phoneValidation = z.string().refine((value) => {
  const digitsOnly = value.replace(/\D/g, "")
  return digitsOnly.length >= 10
}, {
  message: "Phone must include at least 10 digits",
})

export const caregiverFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  relationship: z.enum(caregiverRelationshipOptions, {
    errorMap: () => ({ message: "Relationship is required" }),
  }),
  phone: phoneValidation,
  email: z.string().min(1, "Email is required").max(100).regex(emailRegex, "Invalid email format"),
  status: z.boolean(),
  isPrimary: z.boolean(),
})

export type CaregiverFormValues = z.infer<typeof caregiverFormSchema>

export const caregiverFormDefaults: CaregiverFormValues = {
  firstName: "",
  lastName: "",
  relationship: "Mother",
  phone: "",
  email: "",
  status: true,
  isPrimary: true,
}
