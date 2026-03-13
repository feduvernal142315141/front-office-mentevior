import { z } from "zod"
import { phoneValidation } from "@/lib/schemas/client-form.schema"

export const caregiverFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  relationshipId: z.string().min(1, "Relationship is required"),
  phone: phoneValidation,
  email: z.string().trim().min(1, "Email is required").max(100).email("Invalid email format").toLowerCase(),
  status: z.boolean(),
  isPrimary: z.boolean(),
})

export type CaregiverFormValues = z.infer<typeof caregiverFormSchema>

export const caregiverFormDefaults: CaregiverFormValues = {
  firstName: "",
  lastName: "",
  relationshipId: "",
  phone: "",
  email: "",
  status: true,
  isPrimary: true,
}
