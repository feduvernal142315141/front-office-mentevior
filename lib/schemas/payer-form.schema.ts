import { z } from "zod"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const payerBaseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),

  phone: z.string().refine(
    (val) => {
      if (!val.trim()) return true
      const digits = val.replace(/\D/g, "")
      return digits.length >= 10 && digits.length <= 11
    },
    { message: "Phone must have 10 or 11 digits (including country code if applicable)" }
  ),

  email: z.string().max(100).refine(
    (val) => {
      if (!val.trim()) return true
      return emailRegex.test(val)
    },
    { message: "Invalid email format" }
  ),

  externalId: z.string().max(100).optional().or(z.literal("")),

  groupNumber: z.string().max(100).optional().or(z.literal("")),

  addressLine1: z.string().max(200).optional().or(z.literal("")),

  addressLine2: z.string().max(200).optional().or(z.literal("")),

  city: z.string().max(100).optional().or(z.literal("")),

  countryId: z.string().optional().or(z.literal("")),

  stateId: z.string().optional().or(z.literal("")),

  zipCode: z.string().refine(
    (val) => {
      if (!val.trim()) return true
      return /^\d{5}$/.test(val)
    },
    { message: "ZIP Code must be exactly 5 digits" }
  ),

  planTypeId: z.string().optional().or(z.literal("")),

  planNotes: z.string().max(2000).optional().or(z.literal("")),

  logo: z.string().optional().or(z.literal("")),
})

export type PayerBaseFormValues = z.infer<typeof payerBaseFormSchema>

export const getPayerBaseFormDefaults = (): PayerBaseFormValues => ({
  name: "",
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
  logo: "",
})
