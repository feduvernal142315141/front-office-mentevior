import { z } from "zod"

const phoneRegex = /^[0-9\s\-\(\)\+]+$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ssnRegex = /^\d{9}$/

export const clientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(50)
    .regex(phoneRegex, "Phone number must contain only numbers and valid formatting characters"),
  chartId: z.string().max(50).optional(),
  brithDate: z.string().optional(),
  languages: z.array(z.string()).optional(),
  gender: z.string().max(50).optional(),
  email: z.string().max(100).regex(emailRegex, "Invalid email format").optional().or(z.literal("")),
  ssn: z.string().regex(ssnRegex, "SSN must be exactly 9 digits").optional().or(z.literal("")),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const getClientFormDefaults = (): ClientFormValues => ({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  chartId: "",
  brithDate: "",
  languages: [],
  gender: "",
  email: "",
  ssn: "",
})
