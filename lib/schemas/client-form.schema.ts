import { z } from "zod"

const phoneRegex = /^[0-9\s\-\(\)\+]+$/

export const clientCreateFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(50)
    .regex(phoneRegex, "Phone number must contain only numbers and valid formatting characters"),
  active: z.boolean(),
  chartId: z.string().max(50).optional(),
  diagnosisCode: z.string().max(50).optional(),
  insuranceId: z.string().optional(),
  rbtId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().max(200).optional(),
  guardianPhone: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
})

export const clientEditFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(50)
    .regex(phoneRegex, "Phone number must contain only numbers and valid formatting characters"),
  chartId: z.string().min(1, "Chart ID is required").max(50),
  diagnosisCode: z.string().min(1, "Diagnosis code is required").max(50),
  insuranceId: z.string().min(1, "Insurance is required"),
  active: z.boolean(),
  rbtId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().max(200).optional(),
  guardianPhone: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
})

export type ClientFormValues = z.infer<typeof clientCreateFormSchema>

export const getClientFormDefaults = (): ClientFormValues => ({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  active: true,
  chartId: "",
  diagnosisCode: "",
  insuranceId: "",
  rbtId: "",
  dateOfBirth: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
})
