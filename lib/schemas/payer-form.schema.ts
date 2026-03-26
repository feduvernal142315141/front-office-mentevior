import { z } from "zod"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const payerBaseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),

  logo: z.string().min(1, "Logo is required"),

  phone: z.string().refine(
    (val) => {
      if (!val.trim()) return true
      const digits = val.replace(/\D/g, "")
      return digits.length >= 10 && digits.length <= 11
    },
    { message: "Phone must have 10 or 11 digits (including country code if applicable)" }
  ),

  email: z.string()
    .min(1, "Email is required")
    .max(100, "Email must be less than 100 characters")
    .refine((val) => emailRegex.test(val), { message: "Invalid email format" }),

  externalId: z.string().min(1, "External ID is required").max(100, "External ID must be less than 100 characters"),

  groupNumber: z.string().min(1, "Group number is required").max(100, "Group number must be less than 100 characters"),

  addressLine1: z.string().min(1, "Address line 1 is required").max(200, "Address line 1 must be less than 200 characters"),

  addressLine2: z.string().max(200).optional().or(z.literal("")),

  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),

  countryId: z.string().optional().or(z.literal("")),

  stateId: z.string().min(1, "State is required"),

  zipCode: z.string()
    .min(1, "ZIP Code is required")
    .refine((val) => /^\d{5}$/.test(val), { message: "ZIP Code must be exactly 5 digits" }),

  planTypeId: z.string().min(1, "Allow clearing houses is required"),

  planNotes: z.string().max(2000).optional().or(z.literal("")),
})

export type PayerBaseFormValues = z.infer<typeof payerBaseFormSchema>

export const getPayerBaseFormDefaults = (): PayerBaseFormValues => ({
  name: "",
  logo: "",
  phone: "",
  email: "",
  externalId: "",
  groupNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  countryId: "",
  stateId: "",
  zipCode: "",
  planTypeId: "",
  planNotes: "",
})
