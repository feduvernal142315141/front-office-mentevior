import { z } from "zod"
import { getTodayLocalDate } from "@/lib/date"
import { phoneValidation } from "@/lib/schemas/client-form.schema"

export const userFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  
  cellphone: phoneValidation,
  
  hiringDate: z
    .string()
    .min(1, "Hiring date is required"),
  
  roleId: z
    .string()
    .min(1, "Role is required"),
  
  active: z.boolean().optional(),
  terminated: z.boolean().optional(),
})

export type UserFormValues = z.infer<typeof userFormSchema>

export const getUserFormDefaults = (): UserFormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  cellphone: "",
  hiringDate: getTodayLocalDate(),
  roleId: "",
  active: true,
  terminated: false,
})
