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
  /** Decisión del modal de confirmación al cambiar el correo. No se pinta en el form. */
  resendEmail: z.boolean().optional(),
  memberUserTypeIds: z.array(z.string()).optional().default([]),
  billingCodes: z.array(z.string()).min(1, "At least one billing code is required"),
})

/**
 * The self-service profile form does not edit billing codes or member-user
 * types. Keep those fields required for the user-management form, but do not
 * make them an invisible requirement when updating one's own profile.
 */
export const myProfileFormSchema = userFormSchema.omit({
  memberUserTypeIds: true,
  billingCodes: true,
}).extend({
  hiringDate: z.string().optional(),
})

export type UserFormValues = z.infer<typeof userFormSchema>
export type MyProfileFormValues = z.infer<typeof myProfileFormSchema>

export const getUserFormDefaults = (): UserFormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  cellphone: "",
  hiringDate: getTodayLocalDate(),
  roleId: "",
  active: true,
  terminated: false,
  memberUserTypeIds: [],
  billingCodes: [],
})

export const getMyProfileFormDefaults = (): MyProfileFormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  cellphone: "",
  hiringDate: getTodayLocalDate(),
  roleId: "",
  active: true,
  terminated: false,
})
