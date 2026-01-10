/**
 * ADDRESS FORM SCHEMA
 * 
 * Zod validation schema for address form.
 * Backend only requires: stateId, city, address, zipCode
 */

import { z } from "zod"

/**
 * Validation schema
 */
export const addressFormSchema = z.object({
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
    .regex(/^\d{5}$/, "ZIP Code must be exactly 5 digits"),
})

/**
 * Inferred type from schema
 */
export type AddressFormValues = z.infer<typeof addressFormSchema>

/**
 * Default form values
 */
export const getAddressFormDefaults = (): AddressFormValues => ({
  countryId: "",
  stateId: "",
  city: "",
  address: "",
  zipCode: "",
})
