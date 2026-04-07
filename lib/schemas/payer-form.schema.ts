import { z } from "zod"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const payerBaseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),

  logo: z.string().min(1, "Logo is required"),

  phone: z.string()
    .min(1, "Phone is required")
    .refine(
      (val) => {
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

  countryId: z.string().min(1, "Country is required"),

  stateId: z.string().min(1, "State is required"),

  zipCode: z.string()
    .min(1, "ZIP Code is required")
    .refine((val) => /^\d{5}$/.test(val), { message: "ZIP Code must be exactly 5 digits" }),

  planTypeId: z.string().min(1, "Allow clearing houses is required"),

  description: z.string().max(2000).optional().or(z.literal("")),
})

export type PayerBaseFormValues = z.infer<typeof payerBaseFormSchema>

export const payerPlanSchema = z.object({
  planName: z.string().max(200).optional().or(z.literal("")),
  insurancePlanTypeId: z.string().optional().or(z.literal("")),
  planComments: z.string().max(2000).optional().or(z.literal("")),
})

export type PayerPlanFormValues = z.infer<typeof payerPlanSchema>

export const payerFullFormSchema = payerBaseFormSchema.merge(payerPlanSchema)

export type PayerFullFormValues = z.infer<typeof payerFullFormSchema>

export const getPayerBaseFormDefaults = (): PayerFullFormValues => ({
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
  description: "",
  planName: "",
  insurancePlanTypeId: "",
  planComments: "",
})
