import { z } from "zod"

const phoneRegex = /^[0-9\s\-\(\)\+]+$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Schema para CREATE - Solo 3 campos requeridos
export const clientCreateFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(50)
    .regex(phoneRegex, "Phone number must contain only numbers and valid formatting characters"),
  chartId: z.string().max(50).optional().or(z.literal("")),
  brithDate: z.string().optional().or(z.literal("")),
  languages: z.array(z.string()).optional(),
  genderId: z.string().max(50).optional().or(z.literal("")),
  email: z.string().max(100).regex(emailRegex, "Invalid email format").optional().or(z.literal("")),
  ssn: z
    .string()
    .regex(/^\d{4}$|^\d{9}$/, "SSN must be 4 or 9 digits")
    .optional()
    .or(z.literal("")),
})

// Schema para EDIT - Todos los campos requeridos
export const clientEditFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(50)
    .regex(phoneRegex, "Phone number must contain only numbers and valid formatting characters"),
  chartId: z.string().min(1, "Chart ID is required").max(50),
  brithDate: z.string().min(1, "Date of birth is required"),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  genderId: z.string().min(1, "Gender is required").max(50),
  email: z.string().min(1, "Email is required").max(100).regex(emailRegex, "Invalid email format"),
  ssn: z
    .string()
    .min(1, "Social Security Number is required")
    .regex(/^\d{4}$|^\d{9}$/, "SSN must be 4 or 9 digits"),
})

// Mantener retrocompatibilidad
export const clientFormSchema = clientEditFormSchema

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const getClientFormDefaults = (): ClientFormValues => ({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  chartId: "",
  brithDate: "",
  languages: [],
  genderId: "",
  email: "",
  ssn: "",
})
