/**
 * ACCOUNT PROFILE SCHEMA
 * 
 * Zod validation schema for account profile form.
 * Separated for reusability and testing.
 * 
 * NOTE: Field names match backend API from /api/company/by-auth-token
 */

import { z } from "zod"

/**
 * Validation schema
 */
export const accountProfileSchema = z.object({
  legalName: z
    .string()
    .min(1, "Legal name is required")
    .max(200, "Legal name must be less than 200 characters"),
  
  agencyEmail: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone format"),
  
  fax: z
    .string()
    .regex(/^[\d\s\-\+\(\)]*$/, "Invalid fax format")
    .min(1, "Fax number is required"),
  
  webSite: z
    .string()
    .optional()
    .or(z.literal("")),
  
  ein: z
    .string()
    .min(1, "EIN is required"),
  
  npi: z
    .string()
    .min(1, "NPI is required"),
  
  mpi: z
    .string()
    .min(1, "MPI is required")
    .max(50, "MPI must be less than 50 characters"),
  
  taxonomyCode: z
    .string()
    .min(1, "Taxonomy code is required"),
  
  logo: z
    .string()
    .url("Invalid logo URL")
    .min(1, "Logo is required")
})

/**
 * Inferred type from schema
 */
export type AccountProfileFormValues = z.infer<typeof accountProfileSchema>

/**
 * Default form values
 */
export const getAccountProfileDefaults = (): AccountProfileFormValues => ({
  legalName: "",
  agencyEmail: "",
  phoneNumber: "",
  fax: "",
  webSite: "",
  ein: "",
  npi: "",
  mpi: "",
  taxonomyCode: "",
  logo: "",
})
