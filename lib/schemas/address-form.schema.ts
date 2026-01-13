import { z } from "zod"
import { getTodayLocalDate } from "@/lib/date"

/**
 * Validation schema
 */
export const addressFormSchema = z.object({
  nickName: z
    .string()
    .min(1, "Nickname is required")
    .max(100, "Nickname must be less than 100 characters"),
  
  placeServiceId: z
    .string(),
  
  countryId: z
    .string()
    .min(1, "Country is required"),
  
  stateId: z
    .string()
    .min(1, "State is required"),
  
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  
  address: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be less than 200 characters"),
  
  zipCode: z
    .string()
    .min(1, "Zip code is required")
    .refine((val) => /^\d{5}$/.test(val), {
      message: "ZIP Code must be exactly 5 digits",
    }),
  
  // startDate: z
  //   .string()
  //   .min(1, "Start date is required"),
  
  // endDate: z
  //   .string()
  //   .optional()
  //   .or(z.literal("")),
  
  // active: z.boolean().optional(),
})

/**
 * Inferred type from schema
 */
export type AddressFormValues = z.infer<typeof addressFormSchema>

/**
 * Default form values
 */
export const getAddressFormDefaults = (): AddressFormValues => ({
  nickName: "",
  placeServiceId: "",
  countryId: "",
  stateId: "",
  city: "",
  address: "",
  zipCode: "",
  //startDate: getTodayLocalDate(),
  //endDate: "",
  //active: true,
})
