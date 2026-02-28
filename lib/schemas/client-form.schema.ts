import { z } from "zod"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validación de teléfono: acepta formatos con símbolos pero valida longitud de dígitos
const phoneValidation = z.string().refine((val) => {
  const digitsOnly = val.replace(/\D/g, "")
  return digitsOnly.length >= 10 && digitsOnly.length <= 11
}, {
  message: "Phone must have 10 or 11 digits (including country code if applicable)"
})

// Validación de fecha de nacimiento: no puede ser futura
const birthDateValidation = z.string().refine((val) => {
  if (!val) return true
  const selectedDate = new Date(val)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selectedDate <= today
}, {
  message: "Birth date cannot be in the future"
})

// Schema para CREATE - Solo 3 campos requeridos
export const clientCreateFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: phoneValidation,
  chartId: z.string().max(50).optional().or(z.literal("")),
  brithDate: birthDateValidation.optional().or(z.literal("")),
  languages: z.array(z.string()).optional(),
  genderId: z.string().max(50).optional().or(z.literal("")),
  email: z.string().max(100).regex(emailRegex, "Invalid email format").optional().or(z.literal("")),
  ssn: z
    .string()
    .regex(/^\d{4}$|^\d{9}$/, "SSN must be 4 or 9 digits")
    .optional()
    .or(z.literal("")),
  active: z.boolean().optional(),
})

// Schema para EDIT - Todos los campos requeridos
export const clientEditFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: phoneValidation,
  chartId: z.string().min(1, "Chart ID is required").max(50),
  brithDate: birthDateValidation.refine((val) => val && val.trim() !== "", {
    message: "Date of birth is required"
  }),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  genderId: z.string().min(1, "Gender is required").max(50),
  email: z.string().min(1, "Email is required").max(100).regex(emailRegex, "Invalid email format"),
  ssn: z
    .string()
    .min(1, "Social Security Number is required")
    .regex(/^\d{4}$|^\d{9}$/, "SSN must be 4 or 9 digits"),
  active: z.boolean().optional(),
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
  active: true,
})
