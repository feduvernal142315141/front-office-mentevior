import { z } from "zod"

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
    .min(1, "Logo is required"),

  chartPrefix: z
    .string()
    .min(1, "Chart prefix is required")
    .max(10, "Chart prefix must be less than 10 characters")
    .regex(/^[A-Za-z]+$/, "Only letters are allowed"),

  chartStartNumber: z
    .number({ invalid_type_error: "Must be a number" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
})

export type AccountProfileFormValues = z.infer<typeof accountProfileSchema>

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
  chartPrefix: "BA",
  chartStartNumber: 1,
})
